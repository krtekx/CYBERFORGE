# CyberForge API Key Issue - Summary & Solution

## 🔴 **Current Problem**

Your API keys are getting a **"Quota exceeded"** error with `limit: 0` for the `gemini-2.0-flash` model. This means your Google Cloud project doesn't have access to this model on the free tier.

## ✅ **What We've Implemented**

1. **API Key Manager** - You can now add, manage, and switch between multiple API keys
2. **Automatic Retry Logic** - Retries failed requests up to 3 times with exponential backoff
3. **Automatic Key Rotation** - Switches to your next API key when one hits rate limits
4. **Rate Limit Detection** - Intelligently detects 429 errors and quota issues

## 🎯 **Solutions to Try**

### Option 1: Get Access to Gemini 2.0 Flash (Recommended)
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click on "Get API Key"
4. Make sure you're in a **supported region** (US, EU, etc.)
5. Generate a new API key
6. The key should automatically have access to `gemini-2.0-flash`

### Option 2: Use Multiple API Keys from Different Accounts
1. Create API keys from 2-3 different Google accounts
2. Add all of them to CyberForge using the API Key Manager
3. The app will automatically rotate between them when hitting limits

### Option 3: Wait for Model Availability
- `gemini-2.0-flash` might not be available in your region yet
- Google is gradually rolling out access to different regions
- Check back in a few days

## 📊 **Free Tier Limits (as of Dec 2024)**

| Model | Requests/Minute | Requests/Day |
|-------|----------------|--------------|
| gemini-2.0-flash | 15 RPM | 1,500 RPD |
| gemini-2.5-flash | 2 RPM | 20 RPD |
| gemini-2.5-flash-lite | 30 RPM | 1,500 RPD |

## 🔧 **How the Rate Limiting Works**

When you click FORGE_INIT:
1. **First attempt** - Uses your active API key
2. **If rate limited (429)** - Waits 3 seconds and retries
3. **Still limited?** - Switches to your next API key automatically
4. **Keeps trying** - Up to 3 attempts total with increasing delays (3s, 6s, 12s)

## 💡 **Troubleshooting**

### Error: "Quota exceeded, limit: 0"
**Cause**: Your API key doesn't have access to `gemini-2.0-flash`
**Solution**: 
- Create a new API key in Google AI Studio
- Make sure you're in a supported region
- Try a different Google account

### Error: "429 Too Many Requests"
**Cause**: You've hit the rate limit (requests per minute)
**Solution**:
- Add multiple API keys from different accounts
- The app will automatically rotate between them
- Wait a minute and try again

### Error: "404 Model not found"
**Cause**: The model name is incorrect or not available
**Solution**:
- The app is now using `gemini-2.0-flash` which should work
- If it doesn't, your region might not have access yet

## 🎮 **How to Use the API Key Manager**

1. Click the **🔑 key icon** in the top-right header
2. Click **"+ ADD NEW API KEY"**
3. Enter a name (e.g., "Personal Account", "Work Key")
4. Paste your API key
5. Click **SAVE**

The app will show:
- **Status: SYNCED** when a key is active
- **Key: [Name]** showing which key is currently in use

## 📝 **Next Steps**

1. **Get a fresh API key** from Google AI Studio
2. **Add it** to CyberForge using the API Key Manager
3. **Try FORGE_INIT** again
4. **Check the console** (F12) to see detailed error messages

If you still get errors, the console logs will show exactly what's wrong and we can troubleshoot from there.

## 🌐 **Useful Links**

- [Google AI Studio](https://aistudio.google.com/) - Get API keys
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs) - Official docs
- [Model Availability](https://ai.google.dev/gemini-api/docs/models) - Check which models are available

---

**Note**: The free tier limits are subject to change by Google. Always check the latest documentation for current limits.
