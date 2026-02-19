import unittest
import numpy as np
from src.models.fraud_detection import FraudDetectionModel

class TestFraudDetectionModel(unittest.TestCase):
    def setUp(self):
        self.model = FraudDetectionModel()

    def test_model_initialization(self):
        self.assertIsNotNone(self.model.model)

    def test_prediction_output(self):
        # [amount, method_code, hour, day_of_week, is_weekend]
        sample_features = np.array([[100, 0, 12, 1, 0]])
        prediction = self.model.predict(sample_features)
        score = self.model.get_score(sample_features)
        
        self.assertEqual(len(prediction), 1)
        self.assertIn(prediction[0], [1, -1]) # 1 for normal, -1 for anomaly
        self.assertIsInstance(score[0], (float, np.float32, np.float64))

if __name__ == '__main__':
    unittest.main()
