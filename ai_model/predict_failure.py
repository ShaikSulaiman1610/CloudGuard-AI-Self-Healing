
import sys
import json
from pathlib import Path

import joblib
import pandas as pd

# Load trained AI model
BASE_DIR = Path(__file__).parent
MODEL_PATH = BASE_DIR / "failure_model.pkl"

saved_data = joblib.load(MODEL_PATH)

model = saved_data["model"]
features = saved_data["features"]


def predict_failure(cpu, ram, response_time, error_rate):
    input_data = pd.DataFrame(
        [[cpu, ram, response_time, error_rate]],
        columns=features
    )

    prediction = int(model.predict(input_data)[0])

    risk_index = list(model.classes_).index(1)

    risk_probability = float(
        model.predict_proba(input_data)[0][risk_index]
    )

    status = "HIGH RISK" if prediction == 1 else "NORMAL"

    return {
        "prediction": prediction,
        "status": status,
        "risk_probability": round(risk_probability * 100, 2)
    }


if __name__ == "__main__":
    # JSON mode for Node.js backend integration
    if len(sys.argv) == 6 and sys.argv[1] == "--json":
        try:
            cpu = float(sys.argv[2])
            ram = float(sys.argv[3])
            response_time = float(sys.argv[4])
            error_rate = float(sys.argv[5])

            values = [cpu, ram, response_time, error_rate]

            if not all(
                isinstance(value, float) and
                __import__("math").isfinite(value)
                for value in values
            ):
                raise ValueError("All inputs must be finite numbers")

            if not (0 <= cpu <= 100 and 0 <= ram <= 100):
                raise ValueError("CPU and RAM must be between 0 and 100")

            if response_time < 0:
                raise ValueError("Response time cannot be negative")

            if not (0 <= error_rate <= 100):
                raise ValueError("Error rate must be between 0 and 100")

            result = predict_failure(
                cpu, ram, response_time, error_rate
            )

            print(json.dumps(result))

        except (ValueError, TypeError) as error:
            print(
                json.dumps({"error": str(error)}),
                file=sys.stderr
            )
            sys.exit(1)

    else:
        # Manual testing mode
        cpu_usage = 90
        ram_usage = 95
        response_time = 1800
        error_rate = 25

        result = predict_failure(
            cpu_usage,
            ram_usage,
            response_time,
            error_rate
        )

        print("\n===== AI FAILURE PREDICTION =====")
        print(f"CPU Usage: {cpu_usage}%")
        print(f"RAM Usage: {ram_usage}%")
        print(f"Response Time: {response_time} ms")
        print(f"Error Rate: {error_rate}%")
        print(f"\nPrediction: {result['status']}")
        print(f"Risk Score: {result['risk_probability']}%")
