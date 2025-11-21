#!/bin/bash

# ZION - Deploy to Vercel (Simple)

cd /home/user/ZION/web-app

echo "🚀 ZION Vercel Deployment"
echo "========================"
echo ""

# Build first
echo "📦 Building production version..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Check if Vercel CLI is logged in
echo "🔐 Checking Vercel login..."
if ! vercel whoami 2>/dev/null; then
    echo ""
    echo "📋 You need to login to Vercel first."
    echo ""
    echo "Please run these commands:"
    echo ""
    echo "  cd /home/user/ZION/web-app"
    echo "  vercel login"
    echo ""
    echo "Then run this script again: ./deploy-vercel.sh"
    echo ""
    exit 1
fi

echo "✅ Logged in as: $(vercel whoami)"
echo ""

# Deploy
echo "🚀 Deploying to Vercel..."
echo ""
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "Your ZION app is now live!"
    echo "Check the URL above ☝️"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "Try logging in again:"
    echo "  cd /home/user/ZION/web-app"
    echo "  vercel login"
    echo ""
fi
