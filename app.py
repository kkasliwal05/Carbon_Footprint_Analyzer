from flask import Flask, jsonify, send_file, send_from_directory, request
import requests
import random
import io
import threading
import time
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader

app = Flask(__name__)

# -----------------------------
# HOME
# -----------------------------
@app.route('/')
def home():
    return open("index.html", encoding="utf-8").read()

@app.route('/<path:filename>')
def serve_files(filename):
    return send_from_directory('.', filename)

# -----------------------------
# GLOBAL STORAGE
# -----------------------------
weekly_data = []

# -----------------------------
# REAL-TIME DATA (API + AUTO)
# -----------------------------
@app.route('/realtime', methods=['GET'])
def realtime_data():
    try:
        # 🌦️ Weather API
        url = "https://api.openweathermap.org/data/2.5/weather?q=Pune&appid=0e99c4db20b60d89d1f1678172fb060c"
        res = requests.get(url).json()

        temp = res['main']['temp'] - 273.15  # Kelvin → Celsius
    except:
        temp = random.randint(20, 35)

    # ⚡ Electricity estimation
    electricity_units = 100 + (temp * 2)

    # 🚗 Transport (auto simulation)
    car_km = random.randint(100, 400)

    # ⛽ Fuel
    fuel_litres = car_km / 15

    # 🌍 Emission calculation
    emission = (
        car_km * 0.21 +
        electricity_units * 0.82 +
        fuel_litres * 2.31
    )

    data = {
        "temperature": temp,
        "car_km": car_km,
        "electricity_units": electricity_units,
        "fuel_litres": fuel_litres,
        "emission": emission
    }

    return jsonify(data)

# -----------------------------
# STORE WEEKLY
# -----------------------------
@app.route('/store_weekly', methods=['POST'])
def store_weekly():
    data = request.get_json()
    weekly_data.append(data)
    return jsonify({"message": "Stored"})

# -----------------------------
# WEEKLY SUMMARY
# -----------------------------
@app.route('/weekly_summary', methods=['GET'])
def weekly_summary():
    if not weekly_data:
        return jsonify({"message": "No data"})

    total = sum([d["emission"] for d in weekly_data])
    avg = total / len(weekly_data)

    return jsonify({
        "weekly_avg": avg,
        "total": total
    })

# -----------------------------
# CERTIFICATE GENERATION
# -----------------------------
@app.route('/certificate', methods=['POST'])
def certificate():
    data = request.get_json()

    name = data['user_name']
    emission = float(data['emission'])

    # Eligibility
    if emission < 150:
        status = "Low Emitter 🌱"
    elif emission < 300:
        status = "Average ⚖️"
    else:
        return jsonify({"message": "Not eligible"})

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)

    width, height = letter

    # Background
    bg = ImageReader("green_certificate.png")
    c.drawImage(bg, 0, 0, width=width, height=height)

    # Name
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(width/2, 400, name)

    # Emission
    c.setFont("Helvetica", 14)
    c.drawCentredString(width/2, 360, f"Emission: {emission:.2f} kg CO2/month")

    # Category
    c.drawCentredString(width/2, 330, f"Category: {status}")

    # Date
    today = datetime.now().strftime("%d %B %Y")
    c.drawCentredString(width/2, 300, f"Date: {today}")

    c.save()
    buffer.seek(0)

    return send_file(buffer, as_attachment=True, download_name="Green_Certificate.pdf")

# -----------------------------
# AUTO WEEKLY PROCESS
# -----------------------------
def auto_fetch():
    while True:
        try:
            res = requests.get("http://127.0.0.1:5000/realtime").json()
            weekly_data.append(res)
            print("Weekly data stored:", res)
        except:
            print("Error fetching data")

        time.sleep(604800)  # 7 days

if __name__ == '__main__':
    threading.Thread(target=auto_fetch, daemon=True).start()
    app.run(debug=True, use_reloader=False)

# -----------------------------
# RUN
# -----------------------------
if __name__ == '__main__':
    app.run(debug=True)