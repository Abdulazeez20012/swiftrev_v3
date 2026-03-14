import pandas as pd
import numpy as np
import os
import logging
from sklearn.linear_model import LinearRegression

logger = logging.getLogger(__name__)

class FallbackForecaster:
    """
    A simple but robust forecaster using Linear Regression with seasonal features.
    Works without C++ dependencies.
    """
    def forecast(self, history: pd.DataFrame, periods: int = 30):
        df = history.copy()
        df['ds'] = pd.to_datetime(df['ds'])
        
        # Features: Trend (days since start) + Day of Week seasonality
        start_date = df['ds'].min()
        df['trend'] = (df['ds'] - start_date).dt.days
        df['day_of_week'] = df['ds'].dt.dayofweek
        
        # One-hot encode day of week
        for i in range(7):
            df[f'dow_{i}'] = (df['day_of_week'] == i).astype(int)
            
        features = ['trend'] + [f'dow_{i}' for i in range(7)]
        X = df[features]
        y = df['y']
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Create future dataframe
        last_date = df['ds'].max()
        future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=periods)
        future_df = pd.DataFrame({'ds': future_dates})
        future_df['trend'] = (future_df['ds'] - start_date).dt.days
        future_df['day_of_week'] = future_df['ds'].dt.dayofweek
        for i in range(7):
            future_df[f'dow_{i}'] = (future_df['day_of_week'] == i).astype(int)
            
        # Predict
        preds = model.predict(future_df[features])
        
        # Combine history and future for consistent API (like Prophet)
        # Prophet returns historical yhat too
        hist_preds = model.predict(X)
        
        res_hist = pd.DataFrame({
            'ds': df['ds'],
            'yhat': hist_preds,
            'yhat_lower': hist_preds * 0.9,
            'yhat_upper': hist_preds * 1.1
        })
        
        res_future = pd.DataFrame({
            'ds': future_dates,
            'yhat': preds,
            'yhat_lower': preds * 0.9,
            'yhat_upper': preds * 1.1
        })
        
        return pd.concat([res_hist, res_future], ignore_index=True)

class RevenueForecaster:
    def __init__(self, model_dir: str = "src/models/saved/forecast/"):
        self.model_dir = model_dir
        os.makedirs(self.model_dir, exist_ok=True)
        self.fallback = FallbackForecaster()

    def forecast(self, history: pd.DataFrame, periods: int = 30):
        """
        Forecasts revenue for the next 'periods' days.
        Expected history format: columns=['ds', 'y'] where 'ds' is date and 'y' is revenue.
        """
        try:
            from prophet import Prophet
            # We initialize Prophet inside to catch initialization errors (e.g. missing backend)
            model = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False)
            model.fit(history)
            
            future = model.make_future_dataframe(periods=periods)
            forecast = model.predict(future)
            
            return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
        except Exception as e:
            logger.warning(f"Prophet forecast failed, using scikit-learn fallback: {e}")
            return self.fallback.forecast(history, periods=periods)
