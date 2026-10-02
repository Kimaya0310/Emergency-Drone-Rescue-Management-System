from flask import Flask, jsonify
from flask_cors import CORS

from routes.mission_routes import mission_bp
from routes.detection_routes import detection_bp


app = Flask(__name__)

# Allow requests from the Vite development server.
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173"
            ]
        }
    }
)

app.register_blueprint(mission_bp)
app.register_blueprint(detection_bp)


@app.get("/")
def home():
    return jsonify({
        "message": "Drone-Based Emergency Rescue System API",
        "status": "running"
    })


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "Drone Rescue Backend"
    })


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )