from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
# app.py ke top mein add karo — imports ke saath
import sqlite3
import json
from datetime import datetime

def init_db():
    conn = sqlite3.connect('orders.db')
    c = conn.cursor()
    
    # Purchase Orders Table (already exists)
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
    
    # NEW: Order Requests Table
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

app = Flask(__name__)
CORS(app)  # Allows React to talk to Flask

# Load data once when server starts
df = pd.read_csv("data/sap_inventory.csv")

# ─────────────────────────────────────────
# ROUTE 1: Get all inventory items
# ─────────────────────────────────────────
@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    return jsonify(df.to_dict(orient='records'))


# ─────────────────────────────────────────
# ROUTE 2: Summary cards data
# ─────────────────────────────────────────
@app.route('/api/summary', methods=['GET'])
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
# ROUTE 3: Low stock items only
# ─────────────────────────────────────────
@app.route('/api/lowstock', methods=['GET'])
def get_low_stock():
    low = df[df['Low_Stock'] == True]
    return jsonify(low.to_dict(orient='records'))


# ─────────────────────────────────────────
# ROUTE 4: ML Prediction — Stock trend
# ─────────────────────────────────────────
@app.route('/api/predict', methods=['GET'])
def predict_trend():
    from sklearn.metrics import r2_score
    
    material = request.args.get('material', None)
    
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

    # Generate 18 months data
    monthly_stock = []
    current = base * 1.3
    for month in range(1, 19):
        consumption_rate = (low_stock_count / max(len(filtered), 1)) * 0.08
        current = current * (1 - consumption_rate) + np.random.uniform(-noise, noise)
        current = max(current, min_stock * 0.5)
        monthly_stock.append(round(float(current), 1))

    # Moving Average — window of 3
    def moving_average(data, window=3):
        result = []
        for i in range(len(data)):
            if i < window - 1:
                result.append(round(sum(data[:i+1]) / (i+1), 1))
            else:
                result.append(round(sum(data[i-window+1:i+1]) / window, 1))
        return result

    smoothed = moving_average(monthly_stock, window=3)

    # Train Linear Regression on smoothed data
    X = np.array(range(1, 13)).reshape(-1, 1)
    y = np.array(smoothed[:12])

    model = LinearRegression()
    model.fit(X, y)

    # Predict next 6 months (was 4, now 6!)
    future_X = np.array([13, 14, 15, 16, 17, 18]).reshape(-1, 1)
    predictions = model.predict(future_X)

    # Smooth predictions bhi
    all_values = smoothed[:12] + [round(float(p), 1) for p in predictions]
    all_smoothed = moving_average(all_values, window=3)
    predicted_smoothed = all_smoothed[12:]

    r2 = r2_score(y, model.predict(X))

    result = {
        "material": material or "All Materials",
        "avg_stock": round(float(avg_stock), 1),
        "model_accuracy": round(float(r2) * 100, 1),
        "trend_direction": "📉 Downward" if model.coef_[0] < 0 else "📈 Upward",
        "ml_model": "Linear Regression + Moving Average (window=3)",
        "historical": [
            {"month": f"M{m}", "stock": s}
            for m, s in zip(range(1, 13), smoothed[:12])
        ],
        "predicted": [
            {"month": f"M{m}", "stock": round(float(p), 1)}
            for m, p in zip([13, 14, 15, 16, 17, 18], predicted_smoothed)
        ]
    }
    return jsonify(result)
# ─────────────────────────────────────────
# ROUTE 5: Filter by category or plant
# ─────────────────────────────────────────
@app.route('/api/filter', methods=['GET'])
def filter_data():
    category = request.args.get('category', None)
    plant = request.args.get('plant', None)

    filtered = df.copy()
    if category:
        filtered = filtered[filtered['Category'] == category]
    if plant:
        filtered = filtered[filtered['Plant'] == plant]

    return jsonify(filtered.to_dict(orient='records'))
# ─────────────────────────────────────────
# ROUTE 6: Export to Excel
# ─────────────────────────────────────────
@app.route('/api/export', methods=['GET'])
def export_excel():
    from flask import send_file
    import io

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Sheet 1 - All Inventory
        df.to_excel(writer, sheet_name='All Inventory', index=False)
        
        # Sheet 2 - Low Stock Only
        df[df['Low_Stock'] == True].to_excel(
            writer, sheet_name='Low Stock Alerts', index=False
        )
        
        # Sheet 3 - Summary
        summary_data = {
            'Metric': ['Total Items', 'Low Stock Items', 'Total Stock Value (INR)'],
            'Value': [
                len(df),
                int(df['Low_Stock'].sum()),
                int((df['Stock_Qty'] * df['Unit_Price_INR']).sum())
            ]
        }
        pd.DataFrame(summary_data).to_excel(
            writer, sheet_name='Summary', index=False
        )

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
def send_alert():
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    # ── Tumhari details yahan bharo ──
    SENDER_EMAIL = "mkm063264@gmail.com"    
    APP_PASSWORD = "aosm tgdf oykn ouid"           
    RECEIVER_EMAIL = "mkm063264@gmail.com" 
    # ─────────────────────────────────
    # ─────────────────────────────────────────
# ROUTE 8: Anomaly Detection
# ─────────────────────────────────────────
@app.route('/api/anomalies', methods=['GET'])
def detect_anomalies():
    anomalies = []
    
    # Group by material description
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
            
            # Z-score > 2 means anomaly
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
    
    # Sort by z_score — highest first
    anomalies.sort(key=lambda x: x['Z_Score'], reverse=True)
    
    return jsonify({
        "total_anomalies": len(anomalies),
        "anomalies": anomalies
    })
# ─────────────────────────────────────────
# ROUTE 9: EOQ + Reorder Analysis
# ─────────────────────────────────────────
@app.route('/api/reorder-analysis', methods=['GET'])
def reorder_analysis():
    
    results = []
    
    for _, row in df.iterrows():
        stock_qty = row['Stock_Qty']
        min_stock = row['Min_Stock_Level']
        unit_price = row['Unit_Price_INR']
        
        # ── EOQ Calculation ──
        # EOQ = √(2 × Annual Demand × Ordering Cost / Holding Cost)
        annual_demand = min_stock * 12  # Estimate
        ordering_cost = 5000            # Fixed cost per order (INR)
        holding_cost = unit_price * 0.2 # 20% of unit price per year
        
        if holding_cost > 0:
            eoq = round(((2 * annual_demand * ordering_cost) / holding_cost) ** 0.5)
        else:
            eoq = min_stock * 2
            
        # ── Lead Time ──
        # Supplier wise lead time (days)
        lead_times = {
            "Supplier_A": 7,
            "Supplier_B": 14,
            "Supplier_C": 10,
            "Supplier_D": 5
        }
        lead_time = lead_times.get(row['Supplier'], 10)
        
        # ── Daily Consumption Rate ──
        daily_consumption = min_stock / 30  # Per day
        
        # ── Reorder Point ──
        # Stock pe order kab karna chahiye
        reorder_point = round(daily_consumption * lead_time)
        
        # ── Days Until Stockout ──
        if daily_consumption > 0:
            days_until_stockout = round(stock_qty / daily_consumption)
        else:
            days_until_stockout = 999
            
        # ── Order Urgency ──
        if stock_qty <= reorder_point:
            if days_until_stockout <= 7:
                urgency = "🔴 Critical"
            elif days_until_stockout <= 14:
                urgency = "🟡 High"
            else:
                urgency = "🟢 Normal"
        else:
            urgency = "✅ OK"
            
        # ── Total Order Cost ──
        total_cost = eoq * unit_price
        
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
            "Total_Order_Cost": int(total_cost),
            "Needs_Reorder": bool(stock_qty <= reorder_point)
        })
    
    # Sort by urgency — critical first
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
def create_purchase_order():
    data = request.json
    
    # PO Number generate karo
    po_number = f"PO-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # Expected delivery calculate karo
    lead_times = {
        "Supplier_A": 7, "Supplier_B": 14,
        "Supplier_C": 10, "Supplier_D": 5
    }
    lead_time = lead_times.get(data['supplier'], 10)
    
    from datetime import timedelta
    expected_delivery = (datetime.now() + timedelta(days=lead_time)).strftime('%Y-%m-%d')
    
    conn = sqlite3.connect('orders.db')
    c = conn.cursor()
    
    c.execute('''
        INSERT INTO purchase_orders 
        (po_number, material_id, description, supplier, plant,
         quantity, unit, unit_price, total_cost, status, 
         created_at, expected_delivery, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        po_number,
        data['material_id'],
        data['description'],
        data['supplier'],
        data['plant'],
        data['quantity'],
        data['unit'],
        data['unit_price'],
        data['quantity'] * data['unit_price'],
        'Pending',
        datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        expected_delivery,
        data.get('notes', '')
    ))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True,
        "po_number": po_number,
        "expected_delivery": expected_delivery,
        "message": f"Purchase Order {po_number} created successfully!"
    })


# ─────────────────────────────────────────
# ROUTE 11: Get All Purchase Orders
# ─────────────────────────────────────────
@app.route('/api/purchase-orders', methods=['GET'])
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
def update_order_status(order_id):
    data = request.json
    new_status = data['status']
    
    conn = sqlite3.connect('orders.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Pehle order ki details lo
    c.execute('SELECT * FROM purchase_orders WHERE id = ?', (order_id,))
    order = dict(c.fetchone())
    
    # Status update karo
    c.execute(
        'UPDATE purchase_orders SET status = ? WHERE id = ?',
        (new_status, order_id)
    )
    
    stock_updated = False
    new_stock = None
    
    # Agar status "Delivered" ho gaya
    if new_status == "Delivered" and order['status'] != "Delivered":
        # CSV mein stock update karo
        material_id = order['material_id']
        quantity = order['quantity']
        
        # DataFrame update karo
        mask = df['Material_ID'] == material_id
        if mask.any():
            old_stock = int(df.loc[mask, 'Stock_Qty'].values[0])
            new_stock = old_stock + int(quantity)
            df.loc[mask, 'Stock_Qty'] = new_stock
            
            # Low stock flag recalculate karo
            min_level = int(df.loc[mask, 'Min_Stock_Level'].values[0])
            df.loc[mask, 'Low_Stock'] = new_stock < min_level
            
            # CSV save karo
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
# ROUTE 13: Manual Stock Simulation Trigger
# ─────────────────────────────────────────
@app.route('/api/simulate-day', methods=['POST'])
def simulate_day():
    try:
        from stock_simulator import simulate_daily_movement
        result = simulate_daily_movement()
        
        # Reload dataframe
        global df
        df = pd.read_csv("data/sap_inventory.csv")
        
        return jsonify({
            "success": True,
            "message": f"Daily stock movement simulated!",
            "updated": result['updated'],
            "changes": result['changes'],
            "timestamp": result['timestamp']
        })
    except Exception as err:
        return jsonify({"success": False, "error": str(err)}), 500
    # ─────────────────────────────────────────
# ROUTE 14: Create Order Request (Staff)
# ─────────────────────────────────────────
@app.route('/api/requests', methods=['POST'])
def create_request():
    data = request.json
    
    request_number = f"REQ-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    conn = sqlite3.connect('orders.db')
    c = conn.cursor()
    
    c.execute('''
        INSERT INTO order_requests
        (request_number, material_id, description, category,
         plant, current_stock, min_stock, requested_quantity,
         unit, unit_price, reason, urgency, status,
         requested_by, requested_by_role, requested_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        request_number,
        data['material_id'],
        data['description'],
        data['category'],
        data['plant'],
        data['current_stock'],
        data['min_stock'],
        data['requested_quantity'],
        data['unit'],
        data['unit_price'],
        data['reason'],
        data.get('urgency', 'Normal'),
        'Pending',
        data['requested_by'],
        data['requested_by_role'],
        datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    ))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True,
        "request_number": request_number,
        "message": f"Request {request_number} submitted successfully!"
    })


# ─────────────────────────────────────────
# ROUTE 15: Get All Requests
# ─────────────────────────────────────────
@app.route('/api/requests', methods=['GET'])
def get_requests():
    role = request.args.get('role', 'Admin')
    status_filter = request.args.get('status', None)
    
    conn = sqlite3.connect('orders.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    if status_filter:
        c.execute(
            'SELECT * FROM order_requests WHERE status = ? ORDER BY requested_at DESC',
            (status_filter,)
        )
    else:
        c.execute('SELECT * FROM order_requests ORDER BY requested_at DESC')
    
    requests_list = [dict(row) for row in c.fetchall()]
    conn.close()
    
    return jsonify(requests_list)


# ─────────────────────────────────────────
# ROUTE 16: Manager Action
# ─────────────────────────────────────────
@app.route('/api/requests/<int:req_id>/manager', methods=['PUT'])
def manager_action(req_id):
    data = request.json
    action = data['action']  # 'Approved' or 'Rejected'
    
    conn = sqlite3.connect('orders.db')
    c = conn.cursor()
    
    new_status = 'Manager Approved' if action == 'Approved' else 'Rejected'
    
    c.execute('''
        UPDATE order_requests
        SET status = ?,
            manager_action = ?,
            manager_comment = ?,
            manager_name = ?,
            manager_acted_at = ?
        WHERE id = ?
    ''', (
        new_status,
        action,
        data.get('comment', ''),
        data.get('manager_name', 'Manager'),
        datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        req_id
    ))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True,
        "message": f"Request {action} by Manager!"
    })


# ─────────────────────────────────────────
# ROUTE 17: Admin Action — Convert to PO
# ─────────────────────────────────────────
@app.route('/api/requests/<int:req_id>/admin', methods=['PUT'])
def admin_action(req_id):
    data = request.json
    action = data['action']  # 'Approved' or 'Rejected'
    
    conn = sqlite3.connect('orders.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Request details lo
    c.execute('SELECT * FROM order_requests WHERE id = ?', (req_id,))
    req = dict(c.fetchone())
    
    po_number = None
    
    if action == 'Approved':
        # Purchase Order automatically create karo
        po_number = f"PO-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        lead_times = {
            "Supplier_A": 7, "Supplier_B": 14,
            "Supplier_C": 10, "Supplier_D": 5
        }
        
        # Supplier dhundo
        global df
        df = pd.read_csv("data/sap_inventory.csv")
        material_row = df[df['Material_ID'] == req['material_id']]
        supplier = material_row['Supplier'].values[0] if len(material_row) > 0 else "Supplier_A"
        lead_time = lead_times.get(supplier, 10)
        
        from datetime import timedelta
        expected_delivery = (datetime.now() + timedelta(days=lead_time)).strftime('%Y-%m-%d')
        total_cost = req['requested_quantity'] * req['unit_price']
        
        c.execute('''
            INSERT INTO purchase_orders
            (po_number, material_id, description, supplier, plant,
             quantity, unit, unit_price, total_cost, status,
             created_at, expected_delivery, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            po_number,
            req['material_id'],
            req['description'],
            supplier,
            req['plant'],
            req['requested_quantity'],
            req['unit'],
            req['unit_price'],
            total_cost,
            'Pending',
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            expected_delivery,
            f"Auto-generated from Request {req['request_number']}"
        ))
        
        new_status = 'PO Created'
    else:
        new_status = 'Rejected'
    
    # Request update karo
    c.execute('''
        UPDATE order_requests
        SET status = ?,
            admin_action = ?,
            admin_comment = ?,
            admin_name = ?,
            admin_acted_at = ?,
            po_number = ?
        WHERE id = ?
    ''', (
        new_status,
        action,
        data.get('comment', ''),
        data.get('admin_name', 'Admin'),
        datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        po_number,
        req_id
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
def chat():
    try:
        import google.generativeai as genai
        
        data = request.json
        user_message = data.get('message', '')
        chat_history = data.get('history', [])
        
        # API key configure karo
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return jsonify({
                "success": False,
                "response": "GEMINI_API_KEY not found in .env file"
            }), 500
            
        genai.configure(api_key=api_key)
        
        # Current inventory context
        low_stock = df[df['Low_Stock'] == True]
        total_value = int((df['Stock_Qty'] * df['Unit_Price_INR']).sum())
        health_score = round(((len(df) - len(low_stock)) / len(df)) * 100, 1)
        plant_summary = df.groupby('Plant')['Material_ID'].count().to_dict()
        low_stock_list = low_stock[['Material_ID', 'Description', 
                                     'Stock_Qty', 'Min_Stock_Level', 
                                     'Plant', 'Supplier']].to_dict('records')

        system_prompt = f"""You are InvenIQ, an intelligent inventory assistant for Roquette India Pvt. Ltd., Rudrapur Plant.

CURRENT INVENTORY DATA:
- Total Materials: {len(df)}
- Low Stock Items: {len(low_stock)}
- Total Inventory Value: Rs.{total_value:,}
- Health Score: {health_score}%

PLANT DISTRIBUTION:
{chr(10).join([f"- {plant}: {count} items" for plant, count in plant_summary.items()])}

CATEGORY BREAKDOWN:
{chr(10).join([f"- {cat}: {df[df['Category']==cat]['Material_ID'].count()} items" for cat in df['Category'].unique()])}

LOW STOCK MATERIALS ({len(low_stock)} items):
{chr(10).join([f"- {item['Description']} ({item['Material_ID']}): Stock={item['Stock_Qty']}, Min={item['Min_Stock_Level']}, Plant={item['Plant']}, Supplier={item['Supplier']}" for item in low_stock_list[:15]])}

RULES:
1. Your DEFAULT reply language is ENGLISH. Always reply in English unless rule 2 applies.
2. Reply in Hindi ONLY if the user explicitly asks for it — e.g. they write "hindi mein batao", 
   "reply in hindi", "hindi me jawab do", or similar clear requests for Hindi.
   Do NOT switch to Hindi just because the user typed a message in Hindi/Hinglish — 
   only switch when they explicitly request the Hindi language.
3. Once the user asks for Hindi, keep replying in Hindi for the rest of that conversation 
   unless they ask to switch back to English.
4. Be concise and helpful
5. Use Indian number format (lakhs, crores)
6. Give actionable recommendations
7. Keep responses short and clear
8. You can do calculations based on the data"""

        # Model initialize karo
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_prompt
        )

        # Chat history convert karo
        gemini_history = []
        for msg in chat_history[-6:]:
            if msg['role'] == 'user':
                gemini_history.append({
                    "role": "user",
                    "parts": [msg['content']]
                })
            elif msg['role'] == 'assistant':
                gemini_history.append({
                    "role": "model",
                    "parts": [msg['content']]
                })

        # Chat session
        chat_session = model.start_chat(history=gemini_history)
        response = chat_session.send_message(user_message)

        return jsonify({
            "success": True,
            "response": response.text
        })

    except Exception as err:
        print(f"CHAT ERROR: {str(err)}")
        return jsonify({
            "success": False,
            "error": str(err),
            "response": f"Error: {str(err)}"
        }), 500
    low_items = df[df['Low_Stock'] == True]

    if len(low_items) == 0:
        return jsonify({"message": "Koi low stock item nahi hai!"})

    # Email content banao
    rows = ""
    for _, row in low_items.iterrows():
        rows += f"""
        <tr>
            <td style="padding:8px;border:1px solid #ddd">{row['Material_ID']}</td>
            <td style="padding:8px;border:1px solid #ddd">{row['Description']}</td>
            <td style="padding:8px;border:1px solid #ddd;color:red"><b>{row['Stock_Qty']}</b></td>
            <td style="padding:8px;border:1px solid #ddd">{row['Min_Stock_Level']}</td>
            <td style="padding:8px;border:1px solid #ddd">{row['Plant']}</td>
        </tr>
        """

    html = f"""
    <html>
    <body>
        <h2 style="color:#e63946">⚠️ Low Stock Alert — Roquette Rudrapur</h2>
        <p>Neeche diye gaye <b>{len(low_items)} materials</b> ka stock minimum level se neeche hai:</p>
        
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
        
        <br>
        <p style="color:#888">Ye alert SAP Inventory Dashboard se automatically generate hua hai.</p>
        <p style="color:#888">— Roquette IT System</p>
    </body>
    </html>
    """

    # Email bhejo
    # err_msg = ""
    # try:
    #     msg = MIMEMultipart('alternative')
    #     msg['Subject'] = f"⚠️ Low Stock Alert — {len(low_items)} Items Critical"
    #     msg['From'] = SENDER_EMAIL
    #     msg['To'] = RECEIVER_EMAIL
    #     msg.attach(MIMEText(html, 'html'))

    #     server = smtplib.SMTP('smtp.gmail.com', 587)
    #     server.ehlo()
    #     server.starttls()
    #     server.ehlo()
    #     server.login(SENDER_EMAIL, APP_PASSWORD)
    #     server.sendmail(SENDER_EMAIL, RECEIVER_EMAIL, msg.as_string())
    #     server.quit()

    #     return jsonify({
    #         "success": True,
    #         "message": "Alert email sent successfully!",
    #         "low_items_count": len(low_items),
    #         "items": low_items['Description'].tolist()
    #     })

    # except Exception:
    #     import traceback
    #     err_msg = traceback.format_exc()
    #     print(f"EMAIL ERROR FULL: {err_msg}")
    #     return jsonify({
    #         "success": False,
    #         "error": err_msg
    #     }), 500
if __name__ == '__main__':
    app.run(debug=True, port=5000)