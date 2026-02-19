from prophet import Prophet
import pandas as pd
import os

class RevenueForecaster:
    def __init__(self, model_dir: str = "src/models/saved/forecast/"):
        self.model_dir = model_dir
        os.makedirs(self.model_dir, exist_ok=True)

    def forecast(self, history: pd.DataFrame, periods: int = 30):
        """
        Forecasts revenue for the next 'periods' days.
        Expected history format: columns=['ds', 'y'] where 'ds' is date and 'y' is revenue.
        """
        model = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False)
        model.fit(history)
        
        future = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)
        
        return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
