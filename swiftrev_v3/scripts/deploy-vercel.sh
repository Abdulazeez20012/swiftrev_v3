#!/bin/bash

# Configuration
PROJECT_PATH="apps/web"
VERCEL_ORG_ID="your_org_id"
VERCEL_PROJECT_ID="your_project_id"

echo "🚀 Starting Vercel Deployment for SwiftRev Web..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI not found. Please install it: npm i -g vercel"
    exit 1
fi

# Deploy
cd $PROJECT_PATH
vercel --prod --token $VERCEL_TOKEN --scope $VERCEL_ORG_ID

if [ $? -eq 0 ]; then
    echo "✅ Web Deployment Successful!"
else
    echo "❌ Web Deployment Failed!"
    exit 1
fi
