from flask import Flask, jsonify, request, abort, send_file
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity, get_jwt
)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import sqlite3
import os
import logging
import bcrypt
from functools import wraps
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# ── Logging Setup ──
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

# ── App Init ──
app = Flask(__name__)

# ── CORS ──
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            os.getenv('FRONTEND_URL', 'http://localhost:3000')
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# ── JWT ──
jwt_secret = os.getenv('JWT_SECRET')
if not jwt_secret:
    raise RuntimeError(
        "JWT_SECRET environment variable is not set. "
        "Refusing to start with an insecure default secret. "
        "Set JWT_SECRET before running the app (e.g. generate one with: "
        "python -c \"import secrets; print(secrets.token_hex(32))\")."
    )
app.config['JWT_SECRET_KEY'] = jwt_secret
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=8)
jwt = JWTManager(app)


# ── Role-based Access Control ──
def require_role(*allowed_roles):
    """Use AFTER @jwt_required() on any route that should be restricted
    to specific roles, e.g. @require_role("Admin") or @require_role("Admin", "Manager")."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") not in allowed_roles:
                logger.warning(
                    f"Forbidden: user={get_jwt_identity()} role={claims.get('role')} "
                    f"tried to access {request.path}"
                )
                return jsonify({"success": False, "error": "Forbidden — insufficient permissions"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

# ── Rate Limiter ──
# Uses Redis when REDIS_URL is set (required for multi-worker/production deployments,
# since in-memory storage is per-process and gets diluted across Gunicorn workers).
# Falls back to in-memory storage for local single-process development only.
redis_url = os.getenv('REDIS_URL')
if redis_url:
    limiter_storage_uri = redis_url
    logger.info("Rate limiter using Redis storage (production-safe, shared across workers)")
else:
    limiter_storage_uri = "memory://"
    logger.warning(
        "REDIS_URL not set — rate limiter using in-memory storage. "
        "This is fine for local development but NOT safe for multi-worker production "
        "deployments (each worker gets its own counter, effectively multiplying the limits)."
    )

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=limiter_storage_uri
)

# ── Config ──
SENDER_EMAIL = os.getenv('SENDER_EMAIL')
APP_PASSWORD = os.getenv('APP_PASSWORD')
RECEIVER_EMAIL = os.getenv('RECEIVER_EMAIL', SENDER_EMAIL)


# ── Password Helpers ──
# ── Password Helpers ──
def hash_password(password):
    return bcrypt.hashpw(
        password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

def check_password(password, hashed):
    try:
        return bcrypt.checkpw(
            password.encode('utf-8'),
            hashed.encode('utf-8')
        )
    except Exception:
        return False


# ── Users — Passwords from .env ──
def get_users():
    return {
        "admin": {
            "password_hash": os.getenv('ADMIN_PASSWORD_HASH', ''),
            "password_plain": os.getenv('ADMIN_PASSWORD', ''),
            "role": "Admin",
            "name": "IT Admin",
            "color": "#6366F1"
        },
        "manager": {
            "password_hash": os.getenv('MANAGER_PASSWORD_HASH', ''),
            "password_plain": os.getenv('MANAGER_PASSWORD', ''),
            "role": "Manager",
            "name": "Plant Manager",
            "color": "#10B981"
        },
        "viewer": {
            "password_hash": os.getenv('VIEWER_PASSWORD_HASH', ''),
            "password_plain": os.getenv('VIEWER_PASSWORD', ''),
            "role": "Viewer",
            "name": "Staff",
            "color": "#F59E0B"
        }
    }

# ── Input Validation ──
def validate_string(value, max_length=500, field_name="Field"):
    if not value or not isinstance(value, str):
        abort(400, f"{field_name} is required")
    if len(value.strip()) == 0:
        abort(400, f"{field_name} cannot be empty")
    if len(value) > max_length:
        abort(400, f"{field_name} too long (max {max_length} chars)")
    dangerous = ['<script', 'javascript:', 'onload=', 'onerror=', 'DROP TABLE', '--']
    if any(d.lower() in value.lower() for d in dangerous):
        abort(400, f"{field_name} contains invalid content")
    return value.strip()

def validate_integer(value, min_val=0, max_val=999999, field_name="Field"):
    try:
        val = int(value)
        if val < min_val or val > max_val:
            abort(400, f"{field_name} must be between {min_val} and {max_val}")
        return val
    except (ValueError, TypeError):
        abort(400, f"{field_name} must be a valid number")


# ── Database Init ──
def init_db():
    conn = sqlite3.connect('orders.db')
    c = conn.cursor()

    c.execute('''
        CREATE TABLE IF NOT EXISTS purchase_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            po_number TEXT UNIQUE,
            material_id TEXT,
            description TEXT,
            supplier TEXT,
            plant TEXT,
            quantity INTEGER,
            unit TEXT,
            unit_price REAL,
            total_cost REAL,
            status TEXT DEFAULT 'Pending',
            created_at TEXT,
            expected_delivery TEXT,
            notes TEXT
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS order_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_number TEXT UNIQUE,
            material_id TEXT,
            description TEXT,
            category TEXT,
            plant TEXT,
            current_stock INTEGER,
            min_stock INTEGER,
            requested_quantity INTEGER,
            unit TEXT,
            unit_price REAL,
            reason TEXT,
            urgency TEXT DEFAULT 'Normal',
            status TEXT DEFAULT 'Pending',
            requested_by TEXT,
            requested_by_role TEXT,
            requested_at TEXT,
            manager_action TEXT,
            manager_comment TEXT,
            manager_name TEXT,
            manager_acted_at TEXT,
            admin_action TEXT,
            admin_comment TEXT,
            admin_name TEXT,
            admin_acted_at TEXT,
            po_number TEXT
        )
    ''')

    conn.commit()
    conn.close()

init_db()

# ── Load Data ──
df = pd.read_csv("data/sap_inventory.csv")


# ── Security Headers ──
@app.after_request
def security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response


# ── Error Handlers ──
@app.errorhandler(400)
def bad_request(e):
    return jsonify({"success": False, "error": str(e.description)}), 400

@app.errorhandler(401)
def unauthorized(e):
    return jsonify({"success": False, "error": "Unauthorized"}), 401

@app.errorhandler(429)
def rate_limit_handler(e):
    return jsonify({"success": False, "error": "Too many requests. Please try again later."}), 429

@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Internal error: {str(e)}")
    return jsonify({"success": False, "error": "Internal server error"}), 500


# ─────────────────────────────────────────
# ROUTE: Login
# ─────────────────────────────────────────
@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute; 20 per hour")
def login():
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "message": "Invalid request"}), 400

        username = data.get('username', '').lower().strip()
        password = data.get('password', '').strip()

        if not username or not password:
            return jsonify({
                "success": False,
                "message": "Username aur password required hain"
            }), 400

        if len(username) > 50 or len(password) > 100:
            return jsonify({
                "success": False,
                "message": "Invalid credentials"
            }), 401

        users = get_users()
        user = users.get(username)

        if not user:
            logger.warning(f"Failed login for unknown user: {username}")
            return jsonify({
                "success": False,
                "message": "Invalid username ya password"
            }), 401

        # Check password — hash first, fallback to plain
        password_valid = False
        if user['password_hash']:
            password_valid = check_password(password, user['password_hash'])
        else:
            password_valid = (password == user['password_plain'])

        if not password_valid:
            logger.warning(f"Failed login attempt for: {username}")
            return jsonify({
                "success": False,
                "message": "Invalid username ya password"
            }), 401

        token = create_access_token(
            identity=username,
            additional_claims={
                "role": user['role'],
                "name": user['name'],
                "color": user['color']
            }
        )

        logger.info(f"Successful login: {username}")
        return jsonify({
            "success": True,
            "token": token,
            "user": {
                "username": username,
                "role": user['role'],
                "name": user['name'],
                "color": user['color']
            }
        })

    except Exception as err:
        logger.error(f"Login error: {str(err)}")
        return jsonify({"success": False, "message": "Server error"}), 500


# ─────────────────────────────────────────
# ROUTE: Verify Token
# ─────────────────────────────────────────
@app.route('/api/verify', methods=['GET'])
@jwt_required()
def verify():
    username = get_jwt_identity()
    users = get_users()
    user = users.get(username)
    if not user:
        return jsonify({"success": False}), 401
    return jsonify({
        "success": True,
        "user": {
            "username": username,
            "role": user['role'],
            "name": user['name'],
            "color": user['color']
        }
    })


# ─────────────────────────────────────────
# ROUTE 1: Get all inventory
# ─────────────────────────────────────────
@app.route('/api/inventory', methods=['GET'])
@jwt_required()
def get_inventory():
    return jsonify(df.to_dict(orient='records'))


# ─────────────────────────────────────────
# ROUTE 2: Summary
# ─────────────────────────────────────────
@app.route('/api/summary', methods=['GET'])
@jwt_required()
def get_summary():
    summary = {
        "total_items": int(len(df)),
        "low_stock_count": int(df['Low_Stock'].sum()),
        "total_stock_value": int((df['Stock_Qty'] * df['Unit_Price_INR']).sum()),
        "categories": df['Category'].value_counts().to_dict(),
        "plants": df['Plant'].value_counts().to_dict()
    }
    return jsonify(summary)


# ─────────────────────────────────────────
# ROUTE 3: Low stock
# ─────────────────────────────────────────
@app.route('/api/lowstock', methods=['GET'])
@jwt_required()
def get_low_stock():
    low = df[df['Low_Stock'] == True]
    return jsonify(low.to_dict(orient='records'))


# ─────────────────────────────────────────
# ROUTE 4: ML Prediction
# ─────────────────────────────────────────
@app.route('/api/predict', methods=['GET'])
@jwt_required()
def predict_trend():
    from sklearn.metrics import r2_score

    material = request.args.get('material', None)

    if material and len(material) > 200:
        return jsonify({"error": "Invalid material name"}), 400

    if material:
        filtered = df[df['Description'] == material].copy()
    else:
        filtered = df.copy()

    if len(filtered) == 0:
        return jsonify({"error": "No data found"}), 404

    avg_stock = filtered['Stock_Qty'].mean()
    min_stock = filtered['Stock_Qty'].min()
    max_stock = filtered['Stock_Qty'].max()
    low_stock_count = filtered['Low_Stock'].sum()

    np.random.seed(int(avg_stock))
    base = avg_stock
    noise = (max_stock - min_stock) * 0.1

    monthly_stock = []
    current = base * 1.3
    for month in range(1, 19):
        consumption_rate = (low_stock_count / max(len(filtered), 1)) * 0.08
        current = current * (1 - consumption_rate) + np.random.uniform(-noise, noise)
        current = max(current, min_stock * 0.5)
        monthly_stock.append(round(float(current), 1))

    def moving_average(data, window=3):
        result = []
        for i in range(len(data)):
            if i < window - 1:
                result.append(round(sum(data[:i+1]) / (i+1), 1))
            else:
                result.append(round(sum(data[i-window+1:i+1]) / window, 1))
        return result

    smoothed = moving_average(monthly_stock, window=3)
    X = np.array(range(1, 13)).reshape(-1, 1)
    y = np.array(smoothed[:12])

    model = LinearRegression()
    model.fit(X, y)

    future_X = np.array([13, 14, 15, 16, 17, 18]).reshape(-1, 1)
    predictions = model.predict(future_X)

    all_values = smoothed[:12] + [round(float(p), 1) for p in predictions]
    all_smoothed = moving_average(all_values, window=3)
    predicted_smoothed = all_smoothed[12:]

    r2 = r2_score(y, model.predict(X))

    return jsonify({
        "material": material or "All Materials",
        "avg_stock": round(float(avg_stock), 1),
        "model_accuracy": round(float(r2) * 100, 1),
        "trend_direction": "📉 Downward" if model.coef_[0] < 0 else "📈 Upward",
        "ml_model": "Linear Regression + Moving Average (window=3)",
        "historical": [{"month": f"M{m}", "stock": s} for m, s in zip(range(1, 13), smoothed[:12])],
        "predicted": [{"month": f"M{m}", "stock": round(float(p), 1)} for m, p in zip([13, 14, 15, 16, 17, 18], predicted_smoothed)]
    })


# ─────────────────────────────────────────
# ROUTE 5: Filter
# ─────────────────────────────────────────
@app.route('/api/filter', methods=['GET'])
@jwt_required()
def filter_data():
    category = request.args.get('category', None)
    plant = request.args.get('plant', None)

    allowed_categories = ['Raw Material', 'Finished Good', 'Chemical', 'Packaging']
    allowed_plants = ['Rudrapur', 'Delhi', 'Mumbai']

    filtered = df.copy()
    if category and category in allowed_categories:
        filtered = filtered[filtered['Category'] == category]
    if plant and plant in allowed_plants:
        filtered = filtered[filtered['Plant'] == plant]

    return jsonify(filtered.to_dict(orient='records'))


# ─────────────────────────────────────────
# ROUTE 6: Export Excel
# ─────────────────────────────────────────
@app.route('/api/export', methods=['GET'])
@jwt_required()
@require_role("Admin", "Manager")
@limiter.limit("10 per hour")
def export_excel():
    import io
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='All Inventory', index=False)
        df[df['Low_Stock'] == True].to_excel(writer, sheet_name='Low Stock Alerts', index=False)
        summary_data = {
            'Metric': ['Total Items', 'Low Stock Items', 'Total Stock Value (INR)'],
            'Value': [len(df), int(df['Low_Stock'].sum()), int((df['Stock_Qty'] * df['Unit_Price_INR']).sum())]
        }
        pd.DataFrame(summary_data).to_excel(writer, sheet_name='Summary', index=False)
    output.seek(0)
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='roquette_inventory_report.xlsx'
    )


# ─────────────────────────────────────────
# ROUTE 7: Email Alert
# ─────────────────────────────────────────
@app.route('/api/send-alert', methods=['POST'])
@jwt_required()
@require_role("Admin")
@limiter.limit("3 per hour")
def send_alert():
    import smtplib
    import html as html_lib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    low_items = df[df['Low_Stock'] == True]

    if len(low_items) == 0:
        return jsonify({"message": "Koi low stock item nahi hai!"})

    def esc(value):
        return html_lib.escape(str(value))

    rows = ""
    for _, row in low_items.iterrows():
        rows += f"""
        <tr>
            <td style="padding:8px;border:1px solid #ddd">{esc(row['Material_ID'])}</td>
            <td style="padding:8px;border:1px solid #ddd">{esc(row['Description'])}</td>
            <td style="padding:8px;border:1px solid #ddd;color:red"><b>{esc(row['Stock_Qty'])}</b></td>
            <td style="padding:8px;border:1px solid #ddd">{esc(row['Min_Stock_Level'])}</td>
            <td style="padding:8px;border:1px solid #ddd">{esc(row['Plant'])}</td>
        </tr>
        """

    html = f"""
    <html><body>
        <h2 style="color:#e63946">⚠️ Low Stock Alert — Roquette Rudrapur</h2>
        <p><b>{len(low_items)} materials</b> ka stock minimum level se neeche hai:</p>
        <table style="border-collapse:collapse;width:100%">
            <tr style="background:#f8f9fa">
                <th style="padding:8px;border:1px solid #ddd">Material ID</th>
                <th style="padding:8px;border:1px solid #ddd">Description</th>
                <th style="padding:8px;border:1px solid #ddd">Current Stock</th>
                <th style="padding:8px;border:1px solid #ddd">Min Level</th>
                <th style="padding:8px;border:1px solid #ddd">Plant</th>
            </tr>
            {rows}
        </table>
        <p style="color:#888">— Roquette InvenIQ System</p>
    </body></html>
    """

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"⚠️ Low Stock Alert — {len(low_items)} Items Critical"
        msg['From'] = SENDER_EMAIL
        msg['To'] = RECEIVER_EMAIL
        msg.attach(MIMEText(html, 'html'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SENDER_EMAIL, APP_PASSWORD)
        server.sendmail(SENDER_EMAIL, RECEIVER_EMAIL, msg.as_string())
        server.quit()

        return jsonify({
            "success": True,
            "message": "Alert sent!",
            "low_items_count": len(low_items),
            "items": low_items['Description'].tolist()
        })

    except Exception as err:
        logger.error(f"Email error: {str(err)}")
        return jsonify({
            "success": False,
            "error": "Email sending failed. Check server logs."
        }), 500


# ─────────────────────────────────────────
# ROUTE 8: Anomaly Detection
# ─────────────────────────────────────────
@app.route('/api/anomalies', methods=['GET'])
@jwt_required()
def detect_anomalies():
    anomalies = []
    grouped = df.groupby('Description')

    for material, group in grouped:
        if len(group) < 2:
            continue
        mean = group['Stock_Qty'].mean()
        std = group['Stock_Qty'].std()
        if std == 0:
            continue
        for _, row in group.iterrows():
            z_score = abs((row['Stock_Qty'] - mean) / std)
            if z_score > 2:
                anomaly_type = "Critically Low" if row['Stock_Qty'] < mean else "Unusually High"
                severity = "🔴 High" if z_score > 3 else "🟡 Medium"
                anomalies.append({
                    "Material_ID": row['Material_ID'],
                    "Description": material,
                    "Plant": row['Plant'],
                    "Stock_Qty": int(row['Stock_Qty']),
                    "Average_Stock": round(float(mean), 1),
                    "Z_Score": round(float(z_score), 2),
                    "Anomaly_Type": anomaly_type,
                    "Severity": severity
                })

    anomalies.sort(key=lambda x: x['Z_Score'], reverse=True)
    return jsonify({"total_anomalies": len(anomalies), "anomalies": anomalies})


# ─────────────────────────────────────────
# ROUTE 9: Reorder Analysis
# ─────────────────────────────────────────
@app.route('/api/reorder-analysis', methods=['GET'])
@jwt_required()
def reorder_analysis():
    results = []
    lead_times = {"Supplier_A": 7, "Supplier_B": 14, "Supplier_C": 10, "Supplier_D": 5}

    for _, row in df.iterrows():
        stock_qty = row['Stock_Qty']
        min_stock = row['Min_Stock_Level']
        unit_price = row['Unit_Price_INR']
        annual_demand = min_stock * 12
        ordering_cost = 5000
        holding_cost = unit_price * 0.2
        eoq = round(((2 * annual_demand * ordering_cost) / holding_cost) ** 0.5) if holding_cost > 0 else min_stock * 2
        lead_time = lead_times.get(row['Supplier'], 10)
        daily_consumption = min_stock / 30
        reorder_point = round(daily_consumption * lead_time)
        days_until_stockout = round(stock_qty / daily_consumption) if daily_consumption > 0 else 999

        if stock_qty <= reorder_point:
            urgency = "🔴 Critical" if days_until_stockout <= 7 else "🟡 High" if days_until_stockout <= 14 else "🟢 Normal"
        else:
            urgency = "✅ OK"

        results.append({
            "Material_ID": row['Material_ID'],
            "Description": row['Description'],
            "Category": row['Category'],
            "Plant": row['Plant'],
            "Supplier": row['Supplier'],
            "Current_Stock": int(stock_qty),
            "Min_Stock_Level": int(min_stock),
            "Unit": row['Unit'],
            "Unit_Price_INR": int(unit_price),
            "EOQ": int(eoq),
            "Lead_Time_Days": lead_time,
            "Reorder_Point": int(reorder_point),
            "Days_Until_Stockout": int(days_until_stockout),
            "Urgency": urgency,
            "Total_Order_Cost": int(eoq * unit_price),
            "Needs_Reorder": bool(stock_qty <= reorder_point)
        })

    urgency_order = {"🔴 Critical": 0, "🟡 High": 1, "🟢 Normal": 2, "✅ OK": 3}
    results.sort(key=lambda x: urgency_order.get(x['Urgency'], 4))
    needs_reorder = [r for r in results if r['Needs_Reorder']]

    return jsonify({
        "total_items": len(results),
        "needs_reorder": len(needs_reorder),
        "critical_count": len([r for r in results if r['Urgency'] == "🔴 Critical"]),
        "high_count": len([r for r in results if r['Urgency'] == "🟡 High"]),
        "total_order_budget": sum(r['Total_Order_Cost'] for r in needs_reorder),
        "items": results
    })


# ─────────────────────────────────────────
# ROUTE 10: Create Purchase Order
# ─────────────────────────────────────────
@app.route('/api/purchase-orders', methods=['POST'])
@jwt_required()
@require_role("Admin", "Manager")
def create_purchase_order():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid request"}), 400

    # Validate
    material_id = validate_string(data.get('material_id', ''), 50, 'Material ID')
    description = validate_string(data.get('description', ''), 200, 'Description')
    supplier = validate_string(data.get('supplier', ''), 100, 'Supplier')
    plant = validate_string(data.get('plant', ''), 100, 'Plant')
    quantity = validate_integer(data.get('quantity', 0), 1, 99999, 'Quantity')

    po_number = f"PO-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    lead_times = {"Supplier_A": 7, "Supplier_B": 14, "Supplier_C": 10, "Supplier_D": 5}
    lead_time = lead_times.get(supplier, 10)
    expected_delivery = (datetime.now() + timedelta(days=lead_time)).strftime('%Y-%m-%d')

    conn = sqlite3.connect('orders.db')
    c = conn.cursor()
    try:
        c.execute('''
            INSERT INTO purchase_orders
            (po_number, material_id, description, supplier, plant,
             quantity, unit, unit_price, total_cost, status,
             created_at, expected_delivery, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            po_number, material_id, description, supplier, plant,
            quantity, data.get('unit', ''), data.get('unit_price', 0),
            quantity * data.get('unit_price', 0), 'Pending',
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            expected_delivery, data.get('notes', '')
        ))
        conn.commit()
    except Exception as err:
        conn.rollback()
        logger.error(f"PO creation error: {str(err)}")
        return jsonify({"success": False, "error": "Failed to create PO"}), 500
    finally:
        conn.close()

    return jsonify({
        "success": True,
        "po_number": po_number,
        "expected_delivery": expected_delivery,
        "message": f"Purchase Order {po_number} created!"
    })


# ─────────────────────────────────────────
# ROUTE 11: Get Purchase Orders
# ─────────────────────────────────────────
@app.route('/api/purchase-orders', methods=['GET'])
@jwt_required()
def get_purchase_orders():
    conn = sqlite3.connect('orders.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM purchase_orders ORDER BY created_at DESC')
    orders = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(orders)


# ─────────────────────────────────────────
# ROUTE 12: Update Order Status
# ─────────────────────────────────────────
@app.route('/api/purchase-orders/<int:order_id>', methods=['PUT'])
@jwt_required()
@require_role("Admin", "Manager")
def update_order_status(order_id):
    data = request.json
    new_status = data.get('status', '')

    allowed_statuses = ['Pending', 'Approved', 'Delivered', 'Cancelled']
    if new_status not in allowed_statuses:
        return jsonify({"success": False, "error": "Invalid status"}), 400

    conn = sqlite3.connect('orders.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute('SELECT * FROM purchase_orders WHERE id = ?', (order_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        return jsonify({"success": False, "error": "Order not found"}), 404

    order = dict(row)
    c.execute('UPDATE purchase_orders SET status = ? WHERE id = ?', (new_status, order_id))

    stock_updated = False
    new_stock = None

    if new_status == "Delivered" and order['status'] != "Delivered":
        global df
        material_id = order['material_id']
        quantity = order['quantity']
        mask = df['Material_ID'] == material_id
        if mask.any():
            old_stock = int(df.loc[mask, 'Stock_Qty'].values[0])
            new_stock = old_stock + int(quantity)
            df.loc[mask, 'Stock_Qty'] = new_stock
            min_level = int(df.loc[mask, 'Min_Stock_Level'].values[0])
            df.loc[mask, 'Low_Stock'] = new_stock < min_level
            df.to_csv("data/sap_inventory.csv", index=False)
            stock_updated = True

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Order updated!",
        "stock_updated": stock_updated,
        "new_stock": new_stock,
        "material_id": order['material_id'] if stock_updated else None
    })


# ─────────────────────────────────────────
# ROUTE 13: Simulate Day
# ─────────────────────────────────────────
@app.route('/api/simulate-day', methods=['POST'])
@jwt_required()
@require_role("Admin")
@limiter.limit("10 per hour")
def simulate_day():
    try:
        from stock_simulator import simulate_daily_movement
        result = simulate_daily_movement()
        global df
        df = pd.read_csv("data/sap_inventory.csv")
        return jsonify({
            "success": True,
            "message": "Daily stock movement simulated!",
            "updated": result['updated'],
            "changes": result['changes'],
            "timestamp": result['timestamp']
        })
    except Exception as err:
        logger.error(f"Simulation error: {str(err)}")
        return jsonify({"success": False, "error": "Simulation failed"}), 500


# ─────────────────────────────────────────
# ROUTE 14: Create Request
# ─────────────────────────────────────────
@app.route('/api/requests', methods=['POST'])
@jwt_required()
def create_request():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid request"}), 400

    description = validate_string(data.get('description', ''), 200, 'Description')
    reason = validate_string(data.get('reason', ''), 500, 'Reason')
    quantity = validate_integer(data.get('requested_quantity', 0), 1, 99999, 'Quantity')
    urgency = data.get('urgency', 'Normal')

    if urgency not in ['Normal', 'High', 'Critical']:
        return jsonify({"success": False, "error": "Invalid urgency"}), 400

    request_number = f"REQ-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    conn = sqlite3.connect('orders.db')
    c = conn.cursor()
    try:
        c.execute('''
            INSERT INTO order_requests
            (request_number, material_id, description, category,
             plant, current_stock, min_stock, requested_quantity,
             unit, unit_price, reason, urgency, status,
             requested_by, requested_by_role, requested_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            request_number,
            data.get('material_id', ''),
            description,
            data.get('category', ''),
            data.get('plant', ''),
            data.get('current_stock', 0),
            data.get('min_stock', 0),
            quantity,
            data.get('unit', ''),
            data.get('unit_price', 0),
            reason,
            urgency,
            'Pending',
            data.get('requested_by', ''),
            data.get('requested_by_role', ''),
            datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ))
        conn.commit()
    except Exception as err:
        conn.rollback()
        logger.error(f"Request creation error: {str(err)}")
        return jsonify({"success": False, "error": "Failed to create request"}), 500
    finally:
        conn.close()

    return jsonify({
        "success": True,
        "request_number": request_number,
        "message": f"Request {request_number} submitted!"
    })


# ─────────────────────────────────────────
# ROUTE 15: Get Requests
# ─────────────────────────────────────────
@app.route('/api/requests', methods=['GET'])
@jwt_required()
def get_requests():
    status_filter = request.args.get('status', None)
    conn = sqlite3.connect('orders.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    if status_filter and status_filter in ['Pending', 'Manager Approved', 'PO Created', 'Rejected']:
        c.execute('SELECT * FROM order_requests WHERE status = ? ORDER BY requested_at DESC', (status_filter,))
    else:
        c.execute('SELECT * FROM order_requests ORDER BY requested_at DESC')

    requests_list = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(requests_list)


# ─────────────────────────────────────────
# ROUTE 16: Manager Action
# ─────────────────────────────────────────
@app.route('/api/requests/<int:req_id>/manager', methods=['PUT'])
@jwt_required()
@require_role("Manager", "Admin")
def manager_action(req_id):
    data = request.json
    action = data.get('action', '')

    if action not in ['Approved', 'Rejected']:
        return jsonify({"success": False, "error": "Invalid action"}), 400

    new_status = 'Manager Approved' if action == 'Approved' else 'Rejected'
    comment = validate_string(data.get('comment', 'No comment'), 500, 'Comment') if data.get('comment') else ''

    conn = sqlite3.connect('orders.db')
    c = conn.cursor()
    try:
        c.execute('''
            UPDATE order_requests
            SET status=?, manager_action=?, manager_comment=?,
                manager_name=?, manager_acted_at=?
            WHERE id=?
        ''', (
            new_status, action, comment,
            data.get('manager_name', 'Manager'),
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            req_id
        ))
        conn.commit()
    except Exception as err:
        conn.rollback()
        logger.error(f"Manager action error: {str(err)}")
        return jsonify({"success": False, "error": "Action failed"}), 500
    finally:
        conn.close()

    return jsonify({"success": True, "message": f"Request {action} by Manager!"})


# ─────────────────────────────────────────
# ROUTE 17: Admin Action
# ─────────────────────────────────────────
@app.route('/api/requests/<int:req_id>/admin', methods=['PUT'])
@jwt_required()
@require_role("Admin")
def admin_action(req_id):
    data = request.json
    action = data.get('action', '')

    if action not in ['Approved', 'Rejected']:
        return jsonify({"success": False, "error": "Invalid action"}), 400

    conn = sqlite3.connect('orders.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute('SELECT * FROM order_requests WHERE id = ?', (req_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        return jsonify({"success": False, "error": "Request not found"}), 404

    req = dict(row)
    po_number = None

    if action == 'Approved':
        po_number = f"PO-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        lead_times = {"Supplier_A": 7, "Supplier_B": 14, "Supplier_C": 10, "Supplier_D": 5}
        global df
        df = pd.read_csv("data/sap_inventory.csv")
        material_row = df[df['Material_ID'] == req['material_id']]
        supplier = material_row['Supplier'].values[0] if len(material_row) > 0 else "Supplier_A"
        lead_time = lead_times.get(supplier, 10)
        expected_delivery = (datetime.now() + timedelta(days=lead_time)).strftime('%Y-%m-%d')
        total_cost = req['requested_quantity'] * req['unit_price']

        try:
            c.execute('''
                INSERT INTO purchase_orders
                (po_number, material_id, description, supplier, plant,
                 quantity, unit, unit_price, total_cost, status,
                 created_at, expected_delivery, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                po_number, req['material_id'], req['description'],
                supplier, req['plant'], req['requested_quantity'],
                req['unit'], req['unit_price'], total_cost, 'Pending',
                datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                expected_delivery,
                f"Auto from {req['request_number']}"
            ))
        except Exception as err:
            conn.rollback()
            conn.close()
            logger.error(f"PO creation in admin action error: {str(err)}")
            return jsonify({"success": False, "error": "PO creation failed"}), 500

        new_status = 'PO Created'
    else:
        new_status = 'Rejected'

    comment = data.get('comment', '')
    c.execute('''
        UPDATE order_requests
        SET status=?, admin_action=?, admin_comment=?,
            admin_name=?, admin_acted_at=?, po_number=?
        WHERE id=?
    ''', (
        new_status, action, comment,
        data.get('admin_name', 'Admin'),
        datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        po_number, req_id
    ))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Request {action} by Admin!",
        "po_number": po_number
    })


# ─────────────────────────────────────────
# ROUTE 18: AI Chatbot
# ─────────────────────────────────────────
@app.route('/api/chat', methods=['POST'])
@jwt_required()
@limiter.limit("30 per minute; 100 per hour")
def chat():
    try:
        from groq import Groq

        data = request.json
        user_message = data.get('message', '')
        chat_history = data.get('history', [])

        if not user_message or len(user_message) > 1000:
            return jsonify({"success": False, "response": "Invalid message"}), 400

        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            return jsonify({
                "success": False,
                "response": "AI service not configured"
            }), 500

        low_stock = df[df['Low_Stock'] == True]
        total_value = int((df['Stock_Qty'] * df['Unit_Price_INR']).sum())
        health_score = round(((len(df) - len(low_stock)) / len(df)) * 100, 1)
        plant_summary = df.groupby('Plant')['Material_ID'].count().to_dict()
        low_stock_list = low_stock[['Material_ID', 'Description', 'Stock_Qty',
                                     'Min_Stock_Level', 'Plant', 'Supplier']].to_dict('records')

        system_prompt = f"""You are InvenIQ, an intelligent inventory assistant for Roquette India Pvt. Ltd., Rudrapur Plant.

CURRENT INVENTORY DATA:
- Total Materials: {len(df)}
- Low Stock Items: {len(low_stock)}
- Total Inventory Value: Rs.{total_value:,}
- Health Score: {health_score}%

PLANT DISTRIBUTION:
{chr(10).join([f"- {plant}: {count} items" for plant, count in plant_summary.items()])}

LOW STOCK MATERIALS:
{chr(10).join([f"- {item['Description']}: Stock={item['Stock_Qty']}, Min={item['Min_Stock_Level']}" for item in low_stock_list[:15]])}

RULES: Answer in user's language (Hindi/English). Be concise. Use Indian number format."""

        messages = [{"role": "system", "content": system_prompt}]
        for msg in chat_history[-6:]:
            if msg['role'] in ['user', 'assistant']:
                messages.append({"role": msg['role'], "content": msg['content'][:500]})
        messages.append({"role": "user", "content": user_message})

        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )

        return jsonify({
            "success": True,
            "response": response.choices[0].message.content
        })

    except Exception as err:
        logger.error(f"Chat error occurred")
        return jsonify({
            "success": False,
            "response": "AI service temporarily unavailable. Please try again."
        }), 500


# ─────────────────────────────────────────
# Run
# ─────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'production') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)