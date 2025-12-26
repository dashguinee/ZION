# Google Translate API Setup for Susu

## Quick Setup (5 minutes)

### Step 1: Create Google Cloud Project
1. Go to: https://console.cloud.google.com
2. Create new project: "Susu-AI-Translator"
3. Note your Project ID

### Step 2: Enable Translation API
1. Go to: https://console.cloud.google.com/apis/library/translate.googleapis.com
2. Click "Enable"

### Step 3: Create API Key
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. Copy the key
4. (Optional) Restrict to "Cloud Translation API" for security

### Step 4: Set Environment Variable
```bash
export GOOGLE_TRANSLATE_API_KEY="your-api-key-here"
```

Or add to ~/.bashrc:
```bash
echo 'export GOOGLE_TRANSLATE_API_KEY="your-api-key-here"' >> ~/.bashrc
```

## Free Tier
- **500,000 characters/month FREE**
- Our Bible corpus: ~4M characters (would cost ~$20 one-time)
- For verification: can sample 1000 pairs = ~100k chars = FREE

## Susu Language Code
- **Language code: `sus`**
- Supported in Google Translate since June 2024

## Test with curl
```bash
curl -s "https://translation.googleapis.com/language/translate/v2?key=$GOOGLE_TRANSLATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "q": "Hello, how are you?",
    "source": "en",
    "target": "sus",
    "format": "text"
  }' | jq
```

## Python Usage
```python
import requests
import os

API_KEY = os.environ.get('GOOGLE_TRANSLATE_API_KEY')

def translate_to_susu(text):
    url = f"https://translation.googleapis.com/language/translate/v2?key={API_KEY}"
    response = requests.post(url, json={
        "q": text,
        "source": "en",
        "target": "sus",
        "format": "text"
    })
    return response.json()['data']['translations'][0]['translatedText']

# Example
print(translate_to_susu("I love you"))
```
