#!/bin/bash

# ZION Web App - One-Command Deploy Script
# Run this to deploy to Vercel or Netlify

echo "🚀 ZION Web App Deployment"
echo "=========================="
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this from the web-app directory"
    echo "   cd /home/user/ZION/web-app && ./deploy.sh"
    exit 1
fi

echo "📦 Building production version..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "Choose deployment platform:"
echo "1) Vercel (recommended)"
echo "2) Netlify"
echo "3) GitHub Pages"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Deploying to Vercel..."
        echo ""

        # Check if logged in
        if ! vercel whoami 2>/dev/null; then
            echo "Please login to Vercel:"
            vercel login
        fi

        # Deploy
        vercel --prod
        ;;
    2)
        echo ""
        echo "🚀 Deploying to Netlify..."
        echo ""

        # Install Netlify CLI if needed
        if ! command -v netlify &> /dev/null; then
            echo "Installing Netlify CLI..."
            npm install -g netlify-cli
        fi

        # Check if logged in
        if ! netlify status 2>/dev/null | grep -q "Logged in"; then
            echo "Please login to Netlify:"
            netlify login
        fi

        # Deploy
        netlify deploy --prod --dir=dist
        ;;
    3)
        echo ""
        echo "🚀 Preparing for GitHub Pages..."
        echo ""
        echo "Manual steps:"
        echo "1. Push your code to GitHub"
        echo "2. Go to Settings > Pages"
        echo "3. Select 'GitHub Actions' as source"
        echo "4. Your site will be at: https://dashguinee.github.io/ZION/"
        ;;
    *)
        echo "Invalid choice!"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Click the URL above to view your live site"
echo "2. Test the Contribute, Stats, and Verify tabs"
echo "3. Share the URL with contributors!"
echo ""
