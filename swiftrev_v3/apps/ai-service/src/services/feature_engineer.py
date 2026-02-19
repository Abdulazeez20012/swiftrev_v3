import pandas as pd
import numpy as np
from datetime import datetime

class FeatureEngineer:
    @staticmethod
    def extract_features(transaction_data: dict) -> np.ndarray:
        """
        Converts raw transaction data into a feature vector for ML.
        Features:
        1. Amount (Float)
        2. Payment Method Code (Int: cash=0, card=1, transfer=2)
        3. Hour of Day (Int: 0-23)
        4. Day of Week (Int: 0-6)
        5. Is Weekend (Bool: 0 or 1)
        """
        amount = float(transaction_data.get("amount", 0))
        
        # Payment Method Encoding
        method = transaction_data.get("payment_method", "cash").lower()
        method_map = {"cash": 0, "card": 1, "transfer": 2}
        method_code = method_map.get(method, 0)
        
        # Time-based features
        # If timestamp is provided, parse it. Otherwise use current time.
        created_at = transaction_data.get("created_at")
        if created_at:
            if isinstance(created_at, str):
                dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            else:
                dt = created_at
        else:
            dt = datetime.now()
            
        hour = dt.hour
        day_of_week = dt.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0
        
        return np.array([[amount, method_code, hour, day_of_week, is_weekend]])

    @staticmethod
    def get_feature_names():
        return ["amount", "payment_method_code", "hour", "day_of_week", "is_weekend"]
