# 🌱 CarbonLens — Carbon Footprint Analyzer

## 🚀 Overview

CarbonLens is an AI-powered web application that analyzes carbon emissions based on user activity data.
It processes input data, predicts emissions using Machine Learning, visualizes insights, and rewards sustainable behavior with an automated certificate.

---

## 🎯 Features

* 📊 Carbon Emission Analysis
* 🤖 Machine Learning Prediction (Linear Regression)
* 📂 CSV Upload Support
* 📈 Dashboard Visualization
* 🏆 Green Certificate Generation
* 🌐 Interactive Web Interface

---

## 🧠 How It Works

1. User uploads a CSV file containing activity data
2. Backend processes data using Pandas
3. CO₂ emissions are calculated using emission factors
4. Machine Learning model predicts emissions
5. Dashboard displays results
6. If emission < 200 → Certificate is generated

---

## 🧮 CO₂ Calculation Formula

CO₂ = (car_km × 0.21) + (electricity_units × 0.82) + (fuel_litres × 2.3)

---

## 🤖 Machine Learning Model

* Model Used: Linear Regression
* Type: Supervised Learning
* Purpose: Predict carbon emissions

---

## 🏆 Emission Classification

| Level     | Range (kg CO₂/month) |
| --------- | -------------------- |
| 🟢 Low    | < 200                |
| 🟡 Medium | 200 – 400            |
| 🔴 High   | > 400                |

---

## ⚙️ Tech Stack

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Python (Flask)

### Libraries

* Pandas
* Scikit-learn
* ReportLab

---

## 📁 Project Structure

```id="bdpj3n"
Finalprj/
│
├── app.py
├── index.html
├── style.css
├── script.js
├── green_certificate.png
├── README.md
```

---

## ▶️ How to Run

1. Install dependencies:

```id="5o8drd"
pip install flask pandas scikit-learn reportlab
```

2. Run the app:

```id="n6ruv3"
python app.py
```

3. Open browser:

```id="0s3lyx"
http://127.0.0.1:5000
```

---

## 🚧 Limitations

* Uses static CSV data (not real-time)
* Linear Regression is a basic model
* No real-time API or sensor integration
* Depends on data quality

---

## 🔮 Future Scope

* Real-time data integration using APIs
* Automated data pipeline (no manual CSV upload)
* Advanced ML models (Random Forest, XGBoost)
* IoT-based real-time carbon tracking
* Cloud deployment
* User authentication & tracking

---

## 👩‍💻 Team

* Vishal Anagire — Project Coordinator
* Vaishnavi Gramopadhye — Data Analyst
* Khushi Kasliwal — AI/ML Engineer & Backend Developer
* Prerna Dawada — Frontend Developer

---

## 🌍 Conclusion

CarbonLens helps users understand and manage their carbon footprint using data-driven insights and machine learning.

---

## 🤝 Connect & Support

If you have any questions, feedback, or would like to collaborate, feel free to connect:

👩‍💻 **Khushi Kasliwal**

* 🔗 LinkedIn: https://www.linkedin.com/in/khushi-kasliwal-953692260/
* 💻 GitHub: https://github.com/kkasliwal05

---

⭐ If you found this project helpful, don’t forget to **star the repository**!

