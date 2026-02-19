from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from src.api.fraud import router as fraud_router
from src.api.forecast import router as forecast_router
from src.api.recommendations import router as recommendations_router

load_dotenv()

app = FastAPI(
    title="SwiftRev AI Service",
    description="AI-powered fraud detection and revenue forecasting for hospital revenue management.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(fraud_router)
app.include_router(forecast_router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "SwiftRev AI Service",
        "features": [
            "fraud-detection",
            "revenue-forecasting",
            "agent-recommendations"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
