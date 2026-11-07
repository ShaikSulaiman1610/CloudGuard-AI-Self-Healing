# CloudGuard AI — Cloud Failure Prediction & Automated Self-Healing

CloudGuard AI is an AI-based cloud monitoring and self-healing prototype that uses Machine Learning to predict potential failures, monitors system resources, and performs safe automated recovery of a demo Docker container.

## Features

- Real-time CPU and RAM monitoring
- Machine Learning-based failure risk prediction
- Automatic healing simulation after repeated high-risk predictions
- Real Docker container health monitoring
- Automatic recovery of a stopped demo Docker container
- Safe AI-triggered Docker status checks
- Interactive React monitoring dashboard
- Healing activity history and recovery logs
- Recovery cooldown and duplicate-check protection

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| AI Model | Python, scikit-learn, Random Forest |
| Containerization | Docker |
| Version Control | Git and GitHub |

## System Architecture

```text
React Dashboard
      |
      v
Express.js Backend
      |
      +---- System Metrics (CPU / RAM)
      |
      +---- Python ML Prediction
      |
      +---- Healing Simulation
      |
      +---- Docker Container Monitoring
                    |
                    v
             Safe Docker Recovery
```

## Project Structure

```text
AI_Cloud_Self_Healing/
|
|-- ai_model/
|   |-- generate_dataset.py
|   |-- train_model.py
|   |-- predict_failure.py
|   |-- failure_model.pkl
|
|-- backend/
|   |-- server.js
|   |-- aiService.js
|   |-- healingService.js
|   |-- package.json
|
|-- frontend/
|   |-- src/
|   |-- package.json
|
|-- app.py
|-- .gitignore
|-- README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3
- Docker Desktop
- Python dependencies: scikit-learn and related model dependencies

### Start the Backend

```bash
cd backend
npm install
node server.js
```

Backend: http://localhost:5000

### Start the Frontend

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Dashboard: http://localhost:3000

### Docker Demo Container

The real Docker monitoring and recovery implementation is restricted to a demo container named `cloudguard-demo`.

Docker Desktop must be running, and the demo container must already exist.

The backend currently uses a Windows-specific Docker executable path.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Backend health |
| `/metrics` | GET | CPU and RAM monitoring |
| `/predict` | POST | AI failure prediction |
| `/docker-status` | GET | Docker container status |
| `/heal` | POST | Manual healing simulation |
| `/healing-history` | GET | Recovery activity history |

## AI Model

The prediction model uses a Random Forest classifier trained on synthetic failure data.

Input metrics:

- CPU usage
- RAM usage
- Response time
- Error rate

The risk probability is a prototype model score and should not be interpreted as a calibrated real-world failure probability.

## Self-Healing Safety

- AI-triggered healing simulation is separate from real Docker recovery.
- Real recovery only starts the `cloudguard-demo` container if it is stopped.
- Healthy containers are not restarted because of an AI risk score.
- Docker monitoring runs periodically with a recovery cooldown.
- Other Docker containers are not targeted.

## Project Status

Prototype completed locally with tested AI predictions, monitoring, healing simulation, real Docker recovery, and dashboard integration.

## Future Enhancements

- AWS cloud deployment
- Cloud infrastructure monitoring
- Real-world failure datasets
- Model evaluation and retraining
- Notifications and alerting
- Additional container monitoring
- Production-grade security and configuration

## Disclaimer

This is an educational prototype. It is not intended for unattended production infrastructure recovery without additional safeguards, testing, and monitoring.
