import unittest
import pandas as pd
import numpy as np
from src.models.revenue_forecasting import RevenueForecaster

class TestRevenueForecaster(unittest.TestCase):
    def setUp(self):
        self.forecaster = RevenueForecaster()

    def test_forecast_calculation(self):
        # Create dummy history
        dates = pd.date_range(end=pd.Timestamp.now(), periods=10)
        revenue = [1000, 1200, 1100, 1300, 1400, 1500, 1600, 1700, 1800, 1900]
        df = pd.DataFrame({'ds': dates, 'y': revenue})
        
        forecast = self.forecaster.forecast(df, periods=5)
        
        # Prophet returns a df with ds, yhat, yhat_lower, yhat_upper
        # It includes both historical AND future periods
        self.assertIn('ds', forecast.columns)
        self.assertIn('yhat', forecast.columns)
        self.assertEqual(len(forecast), 15) # 10 history + 5 future
        self.assertGreater(forecast['yhat'].iloc[-1], 0)

if __name__ == '__main__':
    unittest.main()
