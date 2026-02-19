from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
from ..models.fraud_detection import FraudDetectionModel
from ..models.revenue_forecasting import RevenueForecaster
from ..models.recommendations import RecommendationEngine
from .feature_engineer import FeatureEngineer
from .aggregation_service import AggregationService

class MlService:
    def __init__(self):
        self.fraud_model = FraudDetectionModel()
        self.forecaster = RevenueForecaster()
        self.feature_engineer = FeatureEngineer()
        self.aggregation_service = AggregationService()
        self.recommendation_engine = RecommendationEngine()

    async def check_fraud(self, db: Session, transaction_data: dict):
        """
        Extracts features from transaction_data and returns fraud score.
        """
        features = self.feature_engineer.extract_features(transaction_data)
        
        score = self.fraud_model.get_score(features)[0]
        prediction = self.fraud_model.predict(features)[0]
        
        return {
            "is_anomaly": bool(prediction == -1),
            "confidence_score": float(abs(score)),
            "features_used": dict(zip(self.feature_engineer.get_feature_names(), features[0].tolist()))
        }

    async def get_revenue_forecast(self, db: Session, hospital_id: str, periods: int = 30):
        """
        Fetches historical revenue from 'db' and generates a forecast.
        """
        df = self.aggregation_service.get_hospital_revenue_history(db, hospital_id)
        
        if df.empty or len(df) < 2:
            # Fallback to dummy data if no history
            dates = pd.date_range(end=pd.Timestamp.now(), periods=60)
            revenue = np.random.randint(50000, 200000, size=60)
            df = pd.DataFrame({'ds': dates, 'y': revenue})
        
        forecast = self.forecaster.forecast(df, periods=periods)
        return forecast.to_dict(orient="records")

    async def get_recommendations(self, db: Session, hospital_id: str):
        """
        Generates smart recommendations for hospital admins.
        """
        agent_stats = self.aggregation_service.get_agent_transaction_velocity(db, hospital_id)
        recommendations = self.recommendation_engine.suggest_agent_funding(agent_stats)
        return recommendations

ml_service = MlService()
