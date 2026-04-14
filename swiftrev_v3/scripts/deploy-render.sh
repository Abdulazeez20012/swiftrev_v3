#!/bin/bash

# Configuration
# Replace with your actual Render Deploy Hook URL
RENDER_DEPLOY_HOOK_URL=$1

if [ -z "$RENDER_DEPLOY_HOOK_URL" ]; then
    echo "❌ Usage: ./deploy-render.sh <RENDER_DEPLOY_HOOK_URL>"
    exit 1
fi

echo "🚀 Triggering Render Deployment for SwiftRev API..."

curl -X POST "$RENDER_DEPLOY_HOOK_URL"

if [ $? -eq 0 ]; then
    echo "✅ Render Deployment Triggered!"
else
    echo "❌ Failed to trigger Render Deployment!"
    exit 1
fi
