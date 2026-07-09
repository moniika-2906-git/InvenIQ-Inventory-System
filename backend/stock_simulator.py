import pandas as pd
import numpy as np
import time
from datetime import datetime
import os

def simulate_daily_movement():
    """
    Ye function daily stock movement simulate karta hai:
    - Production consumption
    - Random variations
    - Seasonal patterns
    """
    
    df = pd.read_csv("data/sap_inventory.csv")
    today = datetime.now()
    
    np.random.seed(int(datetime.now().timestamp()) % 10000)
    
    changes = []
    
    for idx, row in df.iterrows():
        stock = row['Stock_Qty']
        min_stock = row['Min_Stock_Level']
        category = row['Category']
        
        # Category wise daily consumption rate
        consumption_rates = {
            "Raw Material": np.random.uniform(0.02, 0.06),     # 2-6% daily
            "Finished Good": np.random.uniform(0.03, 0.08),    # 3-8% daily
            "Chemical": np.random.uniform(0.01, 0.04),         # 1-4% daily
            "Packaging": np.random.uniform(0.02, 0.05),        # 2-5% daily
        }
        
        rate = consumption_rates.get(category, 0.03)
        
        # Daily consumption
        daily_consumption = stock * rate
        
        # Random event (10% chance)
        random_event = np.random.random()
        
        if random_event < 0.05:
            # Unexpected high usage — 5% chance
            daily_consumption *= np.random.uniform(1.5, 2.5)
            event = "High Usage"
        elif random_event < 0.08:
            # Partial delivery received — 3% chance
            delivery = min_stock * np.random.uniform(0.5, 1.5)
            daily_consumption = -delivery  # Negative = stock increase
            event = "Delivery Received"
        elif random_event < 0.10:
            # Production stopped — 2% chance
            daily_consumption *= 0.1
            event = "Low Production"
        else:
            event = "Normal"
        
        # New stock
        new_stock = max(0, round(stock - daily_consumption))
        
        # Update
        df.at[idx, 'Stock_Qty'] = new_stock
        df.at[idx, 'Low_Stock'] = new_stock < min_stock
        df.at[idx, 'Last_Updated'] = today.strftime('%Y-%m-%d')
        
        if abs(new_stock - stock) > 5:
            changes.append({
                "material": row['Description'],
                "old_stock": int(stock),
                "new_stock": int(new_stock),
                "change": int(new_stock - stock),
                "event": event
            })
    
    # Save
    df.to_csv("data/sap_inventory.csv", index=False)
    
    print(f"\n{'='*50}")
    print(f"✅ Daily Stock Update — {today.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*50}")
    print(f"Total materials updated: {len(df)}")
    print(f"Significant changes: {len(changes)}")
    
    for c in changes[:5]:  # Top 5 changes
        arrow = "📈" if c['change'] > 0 else "📉"
        print(f"{arrow} {c['material']}: {c['old_stock']} → {c['new_stock']} ({c['event']})")
    
    return {
        "updated": len(df),
        "changes": len(changes),
        "timestamp": today.strftime('%Y-%m-%d %H:%M:%S')
    }


def run_simulator(interval_minutes=1):
    """
    Continuous simulator — har X minute mein update karta hai
    Testing ke liye 1 minute, production mein 60 minute
    """
    print(f"🚀 Stock Simulator Started!")
    print(f"📊 Update interval: {interval_minutes} minute(s)")
    print(f"⏹️  Stop karne ke liye: Ctrl+C")
    print("="*50)
    
    while True:
        try:
            simulate_daily_movement()
            print(f"\n⏳ Next update in {interval_minutes} minute(s)...")
            time.sleep(interval_minutes * 60)
        except KeyboardInterrupt:
            print("\n⏹️ Simulator stopped!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            time.sleep(10)


if __name__ == "__main__":
    # 1 minute interval for testing
    # Real mein 60 minutes hoga
    run_simulator(interval_minutes=1)