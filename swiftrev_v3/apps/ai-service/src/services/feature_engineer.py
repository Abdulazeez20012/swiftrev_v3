import pandas as pd
import numpy as np
from datetime import datetime
import hashlib

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
        6. Patient ID Hash (Int) - for frequency analysis
        7. Item ID Hash (Int) - for price skimming
        8. Auth Code Present (Bool: 0 or 1)
        """
        amount = float(transaction_data.get("amount", 0))
        
        # Payment Method Encoding
        method = transaction_data.get("payment_method", "cash").lower()
        method_map = {"cash": 0, "card": 1, "transfer": 2}
        method_code = method_map.get(method, 0)
        
        # Time-based features
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

        # Identity-based features (hashed to int for model compatibility)
        def simple_hash(val):
            if not val: return 0
            return int(hashlib.md5(str(val).encode()).hexdigest(), 16) % 10000

        patient_hash = simple_hash(transaction_data.get("patient_id"))
        item_hash = simple_hash(transaction_data.get("revenue_item_id"))
        auth_code_present = 1 if transaction_data.get("auth_code") else 0
        
        return np.array([[
            amount, method_code, hour, day_of_week, is_weekend,
            patient_hash, item_hash, auth_code_present
        ]])

    @staticmethod
    def get_feature_names():
        return [
            "amount", "payment_method_code", "hour", "day_of_week", "is_weekend",
            "patient_hash", "item_hash", "auth_code_present"
        ]
