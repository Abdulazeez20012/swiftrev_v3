import pandas as pd
import numpy as np

class RecommendationEngine:
    def suggest_agent_funding(self, agent_stats: pd.DataFrame):
        """
        Suggests top-up amounts for agents based on their 30-day velocity.
        Logic: Suggest a top-up equal to 20% of their 30-day volume.
        """
        recommendations = []
        
        for _, row in agent_stats.iterrows():
            # Basic rule-based recommendation
            suggested_amount = float(row['total_amount'] * 0.20)
            # Round to nearest 5000
            suggested_amount = round(suggested_amount / 5000) * 5000
            
            recommendations.append({
                "agent_id": str(row['agent_id']),
                "reason": "Based on 30-day transaction velocity",
                "suggested_topup": max(suggested_amount, 10000.0), # Minimum 10k
                "metrics": {
                    "monthly_volume": float(row['total_amount']),
                    "tx_count": int(row['tx_count'])
                }
            })
            
        return recommendations
