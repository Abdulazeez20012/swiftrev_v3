from sqlalchemy.orm import Session
from sqlalchemy import text
import pandas as pd

class AggregationService:
    @staticmethod
    def get_hospital_revenue_history(db: Session, hospital_id: str):
        """
        Fetches daily revenue history for a hospital.
        """
        query = text("""
            SELECT 
                created_at::date as ds, 
                SUM(amount) as y 
            FROM transactions 
            WHERE hospital_id = :h_id AND status = 'completed'
            GROUP BY ds 
            ORDER BY ds
        """)
        
        result = db.execute(query, {"h_id": hospital_id})
        df = pd.DataFrame(result.fetchall(), columns=['ds', 'y'])
        
        if df.empty:
            return pd.DataFrame(columns=['ds', 'y'])
            
        # Ensure 'ds' is datetime
        df['ds'] = pd.to_datetime(df['ds'])
        return df

    @staticmethod
    def get_agent_transaction_velocity(db: Session, hospital_id: str):
        """
        Calculates transaction velocity per agent for recommendations.
        """
        query = text("""
            SELECT 
                agent_id,
                COUNT(*) as tx_count,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount
            FROM transactions
            WHERE hospital_id = :h_id AND created_at >= NOW() - INTERVAL '30 days'
            GROUP BY agent_id
        """)
        
        result = db.execute(query, {"h_id": hospital_id})
        return pd.DataFrame(result.fetchall(), columns=['agent_id', 'tx_count', 'total_amount', 'avg_amount'])
