
from flask import Flask, jsonify
from datetime import datetime

app = Flask(__name__)


@app.route("/")
def home():
    return """
    <h1>AI Cloud Self-Healing System</h1>
    <h2>Flask Application Running Successfully!</h2>
    <p>Cloud monitoring system is ready.</p>
    """


@app.route("/health")
def health():
    return jsonify({
        "status": "healthy",
        "service": "AI Cloud Self-Healing System",
        "timestamp": datetime.now().isoformat()
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
