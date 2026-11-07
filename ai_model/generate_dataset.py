
import numpy as np
import pandas as pd
from pathlib import Path

# Reproducible random data
rng = np.random.default_rng(42)

# Generate 5000 simulated monitoring records
total_samples = 5000

cpu_usage = rng.uniform(5, 100, total_samples)
ram_usage = rng.uniform(10, 100, total_samples)
response_time = rng.uniform(50, 2000, total_samples)
error_rate = rng.uniform(0, 30, total_samples)

# Simulated failure-risk rule
risk_score = (
    0.30 * (cpu_usage / 100)
    + 0.25 * (ram_usage / 100)
    + 0.25 * (response_time / 2000)
    + 0.20 * (error_rate / 30)
)

# Add noise to simulate uncertainty
risk_score += rng.normal(0, 0.06, total_samples)

# 1 = simulated failure risk, 0 = normal
failure = (risk_score >= 0.60).astype(int)

# Create dataset
dataset = pd.DataFrame({
    "cpu_usage": np.round(cpu_usage, 2),
    "ram_usage": np.round(ram_usage, 2),
    "response_time": np.round(response_time, 2),
    "error_rate": np.round(error_rate, 2),
    "failure": failure
})

# Save CSV in the ai_model folder
output_path = Path(__file__).parent / "cloud_failure_dataset.csv"

dataset.to_csv(output_path, index=False)

print("Dataset generated successfully!")
print(f"Total records: {len(dataset)}")
print(f"Normal records: {(dataset['failure'] == 0).sum()}")
print(f"Failure-risk records: {(dataset['failure'] == 1).sum()}")
print(f"Dataset saved at: {output_path}")
print()
print(dataset.head())

