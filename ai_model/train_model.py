
from pathlib import Path

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split

# File locations
BASE_DIR = Path(__file__).parent
DATASET_PATH = BASE_DIR / "cloud_failure_dataset.csv"
MODEL_PATH = BASE_DIR / "failure_model.pkl"

# Load simulated dataset
dataset = pd.read_csv(DATASET_PATH)

# Input features
features = [
    "cpu_usage",
    "ram_usage",
    "response_time",
    "error_rate",
]

X = dataset[features]
y = dataset["failure"]

# Split dataset into training and testing
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

# Create Random Forest model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    class_weight="balanced",
)

# Train the model
model.fit(X_train, y_train)

# Predict test data
y_pred = model.predict(X_test)

# Evaluate model
accuracy = accuracy_score(y_test, y_pred)

print("\n===== AI MODEL TRAINING RESULTS =====")
print(f"Training records: {len(X_train)}")
print(f"Testing records: {len(X_test)}")
print(f"Accuracy: {accuracy * 100:.2f}%")

print("\nClassification Report:")
print(classification_report(y_test, y_pred, zero_division=0))

print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nFeature Importance:")
for feature, importance in sorted(
    zip(features, model.feature_importances_),
    key=lambda item: item[1],
    reverse=True,
):
    print(f"{feature}: {importance:.4f}")

# Save trained model and feature order
joblib.dump(
    {
        "model": model,
        "features": features,
    },
    MODEL_PATH,
)

print(f"\nModel saved successfully at: {MODEL_PATH}")

