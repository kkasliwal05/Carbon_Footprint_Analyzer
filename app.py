from flask import Flask, request, jsonify, send_file, send_from_directory
import pandas as pd
from sklearn.linear_model import LinearRegression
from reportlab.pdfgen import canvas
import io

app = Flask(__name__)

# -----------------------------
# HOME (NO TEMPLATE)
# -----------------------------
@app.route('/')
def home():
    return open("index.html", encoding="utf-8").read()

# -----------------------------
# STATIC FILES (CSS/JS/IMAGES)
# -----------------------------
@app.route('/<path:filename>')
def serve_files(filename):
    return send_from_directory('.', filename)

# -----------------------------
# CSV UPLOAD
# -----------------------------
@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    df = pd.read_csv(file)

    df.columns = df.columns.str.strip().str.lower()

    # Fix column names
    rename_map = {}
    for col in df.columns:
        if "co2" in col:
            rename_map[col] = "co2"
        elif "co " in col or col == "co":
            rename_map[col] = "co"
        elif "ch4" in col:
            rename_map[col] = "ch4"

    df.rename(columns=rename_map, inplace=True)

    # Convert numeric
    for col in df.columns:
        if col != "states":
            df[col] = pd.to_numeric(df[col], errors='coerce')

    df = df.dropna()

    # ML
    numeric_cols = df.select_dtypes(include='number').columns.tolist()
    y = df[numeric_cols[0]]
    X = df[numeric_cols[1:]]

    model = LinearRegression()
    model.fit(X, y)

    prediction = model.predict([X.iloc[-1]])[0]
    avg = y.mean()

    return jsonify({
        "success": True,
        "average_emission": float(avg),
        "prediction": float(prediction)
    })

# -----------------------------
# CERTIFICATE
# -----------------------------
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import io
from datetime import datetime

@app.route('/certificate', methods=['POST'])
def certificate():
    data = request.get_json()

    name = data['user_name']
    emission = float(data['emission'])

    # ❌ Not eligible case (same as before)
    if emission > 200:
        return jsonify({"message": "Not eligible"})

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)

    width, height = letter

    # 🖼️ BACKGROUND TEMPLATE (your green certificate)
    bg = ImageReader("green_certificate.png")   # same folder me hona chahiye
    c.drawImage(bg, 0, 0, width=width, height=height)

    # 👤 NAME (perfectly in blank line)
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(width/2, 400, name)

    # 🌱 Emission (below name)
    c.setFont("Helvetica", 14)
    c.drawCentredString(width/2, 360, f"Emission: {emission:.2f} kg CO₂/month")

    # 📅 Date (clean placement)
    today = datetime.now().strftime("%d %B %Y")
    c.setFont("Helvetica", 12)
    c.drawCentredString(width/2, 330, f"Date: {today}")

    c.save()
    buffer.seek(0)

    return send_file(buffer, as_attachment=True, download_name="Green_Certificate.pdf")


# -----------------------------
# RUN
# -----------------------------
if __name__ == '__main__':
    app.run(debug=True)