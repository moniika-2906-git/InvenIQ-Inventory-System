import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os

random.seed(42)
np.random.seed(42)
n = 120

# Roquette-relevant materials
materials_pool = [
    "Native Wheat Starch", "Pea Protein Isolate",
    "Maltodextrin DE18", "Glucose Syrup DE40",
    "Waxy Maize Starch", "Citric Acid Monohydrate",
    "Packaging Film 50mic", "HDPE Drums 200L",
    "Modified Potato Starch", "Sorbitol Solution 70%",
    "Dextrose Monohydrate", "Xanthan Gum",
    "Sodium Bicarbonate", "Calcium Carbonate",
    "Sunflower Oil Refined"
]

categories = {
    "Native Wheat Starch": "Raw Material",
    "Pea Protein Isolate": "Raw Material",
    "Maltodextrin DE18": "Finished Good",
    "Glucose Syrup DE40": "Finished Good",
    "Waxy Maize Starch": "Raw Material",
    "Citric Acid Monohydrate": "Chemical",
    "Packaging Film 50mic": "Packaging",
    "HDPE Drums 200L": "Packaging",
    "Modified Potato Starch": "Finished Good",
    "Sorbitol Solution 70%": "Finished Good",
    "Dextrose Monohydrate": "Finished Good",
    "Xanthan Gum": "Chemical",
    "Sodium Bicarbonate": "Chemical",
    "Calcium Carbonate": "Chemical",
    "Sunflower Oil Refined": "Raw Material"
}

descriptions = random.choices(materials_pool, k=n)

df = pd.DataFrame({
    "Material_ID": [f"MAT-{1000+i}" for i in range(n)],
    "Description": descriptions,
    "Category": [categories[d] for d in descriptions],
    "Stock_Qty": np.random.randint(5, 600, n),
    "Min_Stock_Level": np.random.randint(20, 80, n),
    "Unit": random.choices(["KG", "LTR", "MT", "BAG"], k=n),
    "Plant": random.choices(["Rudrapur", "Delhi", "Mumbai"], k=n),
    "Supplier": random.choices([
        "Supplier_A", "Supplier_B", "Supplier_C", "Supplier_D"
    ], k=n),
    "Unit_Price_INR": np.random.randint(500, 15000, n),
    "Last_Updated": [
        (datetime.today() - timedelta(days=random.randint(0, 60))).strftime('%Y-%m-%d')
        for _ in range(n)
    ]
})

# Add low stock flag
df["Low_Stock"] = df["Stock_Qty"] < df["Min_Stock_Level"]

# Save
os.makedirs("data", exist_ok=True)
df.to_csv("data/sap_inventory.csv", index=False)
print("✅ Mock SAP data generated successfully!")
print(df.head())
print(f"\nTotal records: {len(df)}")
print(f"Low stock items: {df['Low_Stock'].sum()}")