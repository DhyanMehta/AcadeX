"""
ML Service — loads all 7 model files at server startup and provides
predict / explain / trend methods.

Critical rules followed:
- Models loaded ONCE at startup, NOT per-request
- Raw features → XGBoost (no normalization)
- Normalized features → LSTM (using lstm_mean + lstm_std)
- SHAP handles both list and 3D array output formats
"""
import json
import os
import pickle
import logging
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

# ─── Paths ──────────────────────────────────────────
MODELS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "Models"

# ─── Globals ────────────────────────────────────────
xgb_model = None
label_encoder = None
shap_explainer = None
scaler = None
lstm_model = None
lstm_mean = None
lstm_std = None
_loaded = False

FEATURE_NAMES = ["attendance", "marks", "assignment", "lms"]


def load_models():
    """Call once at startup."""
    global xgb_model, label_encoder, shap_explainer, scaler
    global lstm_model, lstm_mean, lstm_std, _loaded

    if _loaded:
        return

    logger.info("Loading ML models from %s", MODELS_DIR)

    try:
        with open(MODELS_DIR / "xgb_model.pkl", "rb") as f:
            xgb_model = pickle.load(f)
        logger.info("XGBoost model loaded.")
    except Exception as exc:
        logger.error("Failed to load xgb_model.pkl: %s", exc)
        return

    try:
        with open(MODELS_DIR / "label_encoder.pkl", "rb") as f:
            label_encoder = pickle.load(f)
        logger.info("Label encoder loaded.")
    except Exception as exc:
        logger.error("Failed to load label_encoder.pkl: %s", exc)
        return

    try:
        with open(MODELS_DIR / "scaler.pkl", "rb") as f:
            scaler = pickle.load(f)
        logger.info("Scaler loaded.")
    except Exception as exc:
        logger.warning("Failed to load scaler.pkl: %s", exc)

    # SHAP explainer — pickle may fail on Python 3.9 due to numba code object
    # incompatibility.  Recreate from the XGBoost model if needed.
    try:
        with open(MODELS_DIR / "shap_explainer.pkl", "rb") as f:
            shap_explainer = pickle.load(f)
        logger.info("SHAP explainer loaded from pickle.")
    except Exception as exc:
        logger.warning("shap_explainer.pkl failed (%s) — recreating from XGBoost model...", exc)
        try:
            import shap
            shap_explainer = shap.TreeExplainer(xgb_model)
            logger.info("SHAP TreeExplainer recreated successfully.")
        except Exception as exc2:
            logger.error("Could not recreate SHAP explainer: %s", exc2)

    try:
        lstm_mean = np.load(MODELS_DIR / "lstm_mean.npy")
        lstm_std = np.load(MODELS_DIR / "lstm_std.npy")
    except Exception as exc:
        logger.warning("LSTM normalization files not loaded: %s", exc)

    # Lazy-import tensorflow to keep startup fast if not needed
    try:
        os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
        from tensorflow.keras.models import load_model as keras_load
        lstm_model = keras_load(MODELS_DIR / "lstm_model.h5", compile=False)
        logger.info("LSTM model loaded.")
    except Exception as exc:
        logger.warning("LSTM model could not be loaded: %s — trend endpoint will be unavailable", exc)
        lstm_model = None

    _loaded = True
    logger.info("All ML models loaded successfully.")


# ─── Weighted risk score (display only) ─────────────
def compute_risk_score(attendance: float, marks: float, assignment: float, lms: float) -> float:
    """0-100 display number. Higher = worse."""
    raw = (
        (100 - attendance) * 0.30
        + (100 - marks) * 0.30
        + (100 - assignment) * 0.25
        + (100 - lms) * 0.15
    )
    return round(min(max(raw, 0), 100), 2)


# ─── XGBoost prediction ────────────────────────────
def predict_risk(attendance: float, marks: float, assignment: float, lms: float) -> dict:
    """Return risk_label, confidence dict, risk_score."""
    import xgboost  # noqa – ensure available

    features = np.array([[attendance, marks, assignment, lms]])
    pred_class = xgb_model.predict(features)[0]
    probas = xgb_model.predict_proba(features)[0]
    risk_label = label_encoder.inverse_transform([int(pred_class)])[0]
    confidence = {label_encoder.inverse_transform([i])[0]: round(float(p), 4) for i, p in enumerate(probas)}
    risk_score = compute_risk_score(attendance, marks, assignment, lms)

    return {
        "risk_label": risk_label,
        "confidence": confidence,
        "risk_score": risk_score,
    }


# ─── SHAP explanation ──────────────────────────────
def explain_risk(attendance: float, marks: float, assignment: float, lms: float) -> list[dict]:
    """Return per-feature SHAP impact."""
    features = np.array([[attendance, marks, assignment, lms]])
    shap_values = shap_explainer.shap_values(features)

    # Handle both output formats
    if isinstance(shap_values, list):
        # Multi-class list format — pick the predicted class
        pred_class = int(xgb_model.predict(features)[0])
        sv = shap_values[pred_class][0]
    elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
        pred_class = int(xgb_model.predict(features)[0])
        sv = shap_values[0, :, pred_class]
    else:
        sv = shap_values[0]

    explanations = []
    for i, name in enumerate(FEATURE_NAMES):
        impact = float(sv[i])
        explanations.append({
            "feature": name,
            "value": float(features[0][i]),
            "impact": round(impact, 4),
            "direction": "increases risk" if impact > 0 else "decreases risk",
        })
    # Sort by absolute impact descending
    explanations.sort(key=lambda x: abs(x["impact"]), reverse=True)
    return explanations


def generate_suggestions(explanations: list[dict], attendance: float, marks: float, assignment: float, lms: float) -> list[str]:
    """Human-readable improvement suggestions."""
    suggestions = []
    if attendance < 75:
        suggestions.append(f"Your attendance is {attendance:.0f}%. Aim for at least 75% to stay safe.")
    if marks < 50:
        suggestions.append(f"Your internal marks percentage is {marks:.0f}%. Focus on upcoming assessments.")
    if assignment < 60:
        suggestions.append(f"Assignment completion is at {assignment:.0f}%. Submit pending assignments ASAP.")
    if lms < 40:
        suggestions.append(f"LMS activity score is {lms:.0f}%. Log in more frequently and engage with course material.")
    if not suggestions:
        suggestions.append("Great job! Keep maintaining your current academic performance.")
    return suggestions


# ─── LSTM trend prediction ─────────────────────────
def predict_trend(weekly_snapshots: list[list[float]]) -> dict:
    """
    Expects up to 5 weekly snapshots, each with [attendance, marks, assignment, lms].
    Pads if fewer than 5.
    Returns predicted next week score and alert flag.
    """
    if lstm_model is None:
        return {"predicted_next_score": -1, "trend": "unavailable", "alert_needed": False}

    # Pad to 5 weeks
    while len(weekly_snapshots) < 5:
        weekly_snapshots.insert(0, weekly_snapshots[0])

    arr = np.array(weekly_snapshots[-5:], dtype=np.float64)
    # Normalize
    safe_std = np.where(lstm_std == 0, 1, lstm_std)
    arr_norm = (arr - lstm_mean) / safe_std
    arr_norm = arr_norm.reshape(1, 5, 4)

    pred = float(lstm_model.predict(arr_norm, verbose=0)[0][0])
    # Clamp
    pred = min(max(pred, 0), 100)

    # Determine trend
    current_score = compute_risk_score(*weekly_snapshots[-1])
    if pred > current_score + 5:
        trend = "worsening"
    elif pred < current_score - 5:
        trend = "improving"
    else:
        trend = "stable"

    return {
        "predicted_next_score": round(pred, 2),
        "trend": trend,
        "alert_needed": pred >= 60,
    }


def generate_ai_explanation(explanations: list[dict]) -> str:
    """Convert SHAP explanations into a readable paragraph."""
    top = explanations[:3]
    parts = []
    for e in top:
        if e["direction"] == "increases risk":
            parts.append(f"Low {e['feature']} ({e['value']:.0f}%) is a major risk factor")
        else:
            parts.append(f"Good {e['feature']} ({e['value']:.0f}%) is helping reduce risk")
    return ". ".join(parts) + "." if parts else "No significant risk factors detected."
