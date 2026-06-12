#!/usr/bin/env python3
"""
MAN OF STEEL — ML Training Script
Trains XGBoost models for failure probability and RUL estimation.
Run: python scripts/ml/train_model.py
Requires: pip install scikit-learn xgboost numpy pandas
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, mean_absolute_error
import xgboost as xgb

np.random.seed(42)
N_SAMPLES = 5000

MACHINE_TYPES = [
    "rolling_mill", "blast_furnace_fan", "hydraulic_pump", "conveyor", "overhead_crane"
]

BASELINES = {
    "rolling_mill": {"temp": 68, "pressure": 6.2, "rpm": 2800, "vib": 2.8, "max_hrs": 50000},
    "blast_furnace_fan": {"temp": 72, "pressure": 4.8, "rpm": 1450, "vib": 3.2, "max_hrs": 40000},
    "hydraulic_pump": {"temp": 55, "pressure": 12.5, "rpm": 1800, "vib": 1.9, "max_hrs": 30000},
    "conveyor": {"temp": 45, "pressure": 2.1, "rpm": 420, "vib": 1.2, "max_hrs": 60000},
    "overhead_crane": {"temp": 38, "pressure": 8.0, "rpm": 960, "vib": 1.5, "max_hrs": 35000},
}

def generate_data(n: int) -> pd.DataFrame:
    rows = []
    for _ in range(n):
        mt = np.random.choice(MACHINE_TYPES)
        b = BASELINES[mt]
        degradation = np.random.beta(2, 5)
        temp = b["temp"] + degradation * 25 + np.random.normal(0, 3)
        pressure = b["pressure"] + degradation * 3 + np.random.normal(0, 0.3)
        rpm = b["rpm"] + degradation * 300 + np.random.normal(0, 40)
        vib = b["vib"] + degradation * 4 + np.random.normal(0, 0.3)
        hours = b["max_hrs"] * (0.3 + degradation * 0.6) + np.random.normal(0, 1000)
        hours_norm = hours / b["max_hrs"]

        fail_score = (
            0.18 * (temp / 100) +
            0.12 * (pressure / 15) +
            0.08 * (rpm / 4000) +
            0.35 * (vib / 10) +
            0.27 * hours_norm
        )
        failure_prob = 1 / (1 + np.exp(-(fail_score - 0.42)))
        failed = int(failure_prob > 0.55 + np.random.normal(0, 0.1))
        rul = max(100, 12000 - 45*(temp/100) - 120*(pressure/15) - 2.5*(rpm/4000)
                  - 800*(vib/10) - 6000*hours_norm + np.random.normal(0, 500))

        rows.append({
            "temperature_c": temp, "pressure_bar": pressure, "rpm": rpm,
            "vibration_mm_s": vib, "operating_hours_norm": hours_norm,
            "failure": failed, "rul_hours": rul, "machine_type": mt,
        })
    return pd.DataFrame(rows)

def main():
    print("Generating synthetic training data...")
    df = generate_data(N_SAMPLES)
    features = ["temperature_c", "pressure_bar", "rpm", "vibration_mm_s", "operating_hours_norm"]
    X = df[features]
    y_class = df["failure"]
    y_reg = df["rul_hours"]

    X_train, X_test, y_train, y_test = train_test_split(X, y_class, test_size=0.2, random_state=42)
    _, _, y_reg_train, y_reg_test = train_test_split(X, y_reg, test_size=0.2, random_state=42)

    clf = xgb.XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42)
    clf.fit(X_train, y_train)
    prob_preds = clf.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, prob_preds)
    print(f"Classification AUC: {auc:.4f}")

    reg = xgb.XGBRegressor(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42)
    reg.fit(X_train, y_reg_train)
    rul_preds = reg.predict(X_test)
    mae = mean_absolute_error(y_reg_test, rul_preds)
    print(f"RUL MAE: {mae:.1f} hours")

    # Export simplified coefficients for TypeScript inference
    output = {
        "version": "v1.0-xgb",
        "classification_auc": round(auc, 4),
        "rul_mae_hours": round(mae, 1),
        "feature_importance": dict(zip(features, clf.feature_importances_.tolist())),
        "n_samples": N_SAMPLES,
    }

    out_path = Path(__file__).parent / "model_metrics.json"
    out_path.write_text(json.dumps(output, indent=2))
    print(f"Metrics saved to {out_path}")
    print("TypeScript inference uses pre-exported coefficients in src/lib/ml/model.ts")

if __name__ == "__main__":
    main()
