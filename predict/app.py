from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib

app = Flask(__name__)
CORS(app) # Enable CORS for all routes
model = joblib.load("risk_model.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    X = [[
        data["temperature"],
        data["humidity"],
        data["soil_moisture"],
        data["rain_status"]
    ]]

    pred = model.predict(X)[0]

    recommendation = {
        0: "Kondisi aman. Tidak diperlukan tindakan khusus.",
        1: "Perlu perhatian. Pantau kelembapan dan sirkulasi udara.",
        2: "Risiko tinggi. Disarankan meningkatkan ventilasi dan mengurangi kelembapan."
    }

    return jsonify({
        "risk_level": int(pred),
        "recommendation": recommendation[pred]
    })

if __name__ == "__main__":
    app.run(port=5000)
