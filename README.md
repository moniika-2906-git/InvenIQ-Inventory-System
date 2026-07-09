# 🏭 InvenIQ — AI-Powered Inventory Intelligence System

> Built during internship at Roquette India Pvt. Ltd., Rudrapur

## 🚀 Live Demo
[Add link after deployment]

## 📋 Overview
InvenIQ is a full-stack inventory management system that integrates 
with SAP-structured data to provide real-time analytics, ML-based 
stock forecasting, automated purchase orders, and AI-powered insights.

## ✨ Features

### 📊 Analytics Dashboard
- Real-time inventory monitoring across 3 plants
- Category & plant-wise distribution charts
- Inventory health score with visual indicators
- AI anomaly detection using Z-Score method

### 🤖 ML Stock Forecasting  
- Linear Regression + Moving Average prediction
- 6-month stock trend forecast
- Material-wise prediction with accuracy score
- Automatic stockout detection

### 📋 Purchase Order Workflow
- 3-level approval: Staff → Manager → Admin
- Automatic EOQ (Economic Order Quantity) calculation
- PDF purchase order generation
- Real-time status tracking for all users

### 🤖 AI Chatbot (Google Gemini)
- Natural language inventory queries
- Real-time data context
- Hindi & English support

### 🔐 Role-Based Access Control
- Admin: Full access + PO generation
- Manager: Approval + analytics
- Viewer/Staff: Request submission + tracking

### 📤 Export Options
- Excel export (3 sheets)
- PDF reports
- Print-ready layouts

## 🛠️ Tech Stack

### Frontend
- React.js
- Recharts (data visualization)
- jsPDF (PDF generation)

### Backend
- Python + Flask
- Pandas + NumPy
- Scikit-Learn (ML)
- SQLite (order database)
- Google Gemini AI

### Key Concepts
- REST API architecture
- ML forecasting (Linear Regression + Moving Average)
- Statistical anomaly detection (Z-Score)
- EOQ (Economic Order Quantity) calculation

## 🚀 Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Fill in your .env values
python generate_data.py
python app.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```


## 👩‍💻 Developer
**Monika Kumari**  
Software Engineer Intern — Roquette India Pvt. Ltd.  
B.Tech CSE, Sanskriti University (2023-2027)

## 📝 Note on Data Privacy
This project uses synthetic data generated to mirror SAP MM module 
export structure. No real company data was used in compliance with 
organizational data confidentiality policies.
