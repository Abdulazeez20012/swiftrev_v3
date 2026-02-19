import numpy as np
from sklearn.ensemble import IsolationForest
import pandas as pd
import joblib
import os

class FraudDetectionModel:
    def __init__(self, model_path: str = "src/models/saved/fraud_model.joblib"):
        self.model_path = model_path
        self.model = self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            return joblib.load(self.model_path)
        else:
            # Initializing with a default model if not found
            model = IsolationForest(contamination=0.1, random_state=42)
            # Dummy fit so predict() doesn't fail before training
            # Assuming 5 features based on FeatureEngineer
            dummy_data = np.random.rand(10, 5)
            model.fit(dummy_data)
            return model

    def train(self, data: pd.DataFrame):
        """
        Trains the Isolation Forest model on transaction data.
        Expected features: [amount, status_code, payment_method_code, time_of_day]
        """
        self.model.fit(data)
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.model, self.model_path)

    def predict(self, features: np.ndarray):
        """
        Predicts if a transaction is anomalous.
        Returns: 1 for normal, -1 for anomaly
        """
        return self.model.predict(features)

    def get_score(self, features: np.ndarray):
        """
        Returns anomaly scores (lower values are more anomalous).
        """
        return self.model.decision_function(features)
