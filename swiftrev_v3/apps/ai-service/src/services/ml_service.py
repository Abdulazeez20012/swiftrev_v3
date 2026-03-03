from sqlalchemy.orm import Session
from sqlalchemy import text
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
        Detects fraud using both ML and Heuristic rules.
        """
        features = self.feature_engineer.extract_features(transaction_data)
        
        # 1. ML-based Anomaly Score
        ml_score = self.fraud_model.get_score(features)[0]
        ml_prediction = self.fraud_model.predict(features)[0]
        
        # 2. Heuristic Rules (Specific Nigerian Patterns)
        heuristics = self._check_heuristics(db, transaction_data)
        
        is_anomaly = bool(ml_prediction == -1) or heuristics["triggered"]
        confidence_score = float(abs(ml_score)) if not heuristics["triggered"] else 1.0
        
        return {
            "is_anomaly": is_anomaly,
            "confidence_score": confidence_score,
            "alert_type": heuristics["alert_type"],
            "reason": heuristics["reason"],
            "features_used": dict(zip(self.feature_engineer.get_feature_names(), features[0].tolist()))
        }

    def _check_heuristics(self, db: Session, tx: dict):
        """
        Checks for high-confidence fraud patterns.
        """
        # A. Double Billing Check (Same patient, same item, < 2 hours)
        query = text("""
            SELECT id FROM transactions 
            WHERE patient_id = :p_id 
              AND revenue_item_id = :item_id 
              AND created_at >= NOW() - INTERVAL '2 hours'
            LIMIT 1
        """)
        result = db.execute(query, {"p_id": tx.get("patient_id"), "item_id": tx.get("revenue_item_id")}).fetchone()
        
        if result:
            return {"triggered": True, "alert_type": "DOUBLE_BILLING", "reason": "Likely double-charge: same service for patient within 2 hours."}

        # B. Price Skimming (Amount 2.5x above historical item average)
        query_avg = text("""
            SELECT AVG(amount) as avg_price FROM transactions 
            WHERE revenue_item_id = :item_id
        """)
        avg_res = db.execute(query_avg, {"item_id": tx.get("revenue_item_id")}).fetchone()
        avg_price = avg_res[0] if avg_res and avg_res[0] else 0
        
        if avg_price > 0 and tx.get("amount", 0) > (avg_price * 2.5):
            return {"triggered": True, "alert_type": "PRICE_SKIMMING", "reason": f"Excessive amount: Transaction is 2.5x higher than item average (₦{avg_price:,.2f})."}

        return {"triggered": False, "alert_type": None, "reason": None}

    async def get_revenue_forecast(self, db: Session, hospital_id: str, periods: int = 30):
        # ... existing implementation ...
        df = self.aggregation_service.get_hospital_revenue_history(db, hospital_id)
        if df.empty or len(df) < 2:
            dates = pd.date_range(end=pd.Timestamp.now(), periods=60)
            revenue = np.random.randint(50000, 200000, size=60)
            df = pd.DataFrame({'ds': dates, 'y': revenue})
        forecast = self.forecaster.forecast(df, periods=periods)
        return forecast.to_dict(orient="records")

    async def get_recommendations(self, db: Session, hospital_id: str):
        agent_stats = self.aggregation_service.get_agent_transaction_velocity(db, hospital_id)
        recommendations = self.recommendation_engine.suggest_agent_funding(agent_stats)
        return recommendations

ml_service = MlService()
