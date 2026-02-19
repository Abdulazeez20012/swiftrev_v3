import unittest
import numpy as np
from src.services.feature_engineer import FeatureEngineer

class TestFeatureEngineer(unittest.TestCase):
    def setUp(self):
        self.fe = FeatureEngineer()

    def test_extract_features_basic(self):
        data = {
            "amount": 1000,
            "payment_method": "cash",
            "created_at": "2026-02-17T10:00:00Z"
        }
        features = self.fe.extract_features(data)
        
        self.assertEqual(features.shape, (1, 5))
        self.assertEqual(features[0, 0], 1000.0) # Amount
        self.assertEqual(features[0, 1], 0)      # Cash code
        self.assertEqual(features[0, 2], 10)     # Hour
        self.assertEqual(features[0, 3], 1)      # Tuesday (17th Feb 2026 is Tuesday, weekday=1)

    def test_extract_features_card(self):
        data = {
            "amount": 5000,
            "payment_method": "card",
            "created_at": "2026-02-17T15:00:00Z"
        }
        features = self.fe.extract_features(data)
        self.assertEqual(features[0, 1], 1) # Card code
        self.assertEqual(features[0, 2], 15) # Hour

    def test_extract_features_weekend(self):
        # 21st Feb 2026 is Saturday
        data = {
            "amount": 5000,
            "payment_method": "transfer",
            "created_at": "2026-02-21T10:00:00Z"
        }
        features = self.fe.extract_features(data)
        self.assertEqual(features[0, 4], 1) # Is weekend

if __name__ == '__main__':
    unittest.main()
