# API Setup Guide for MEME-BUSTERS.COM

This guide will walk you through setting up API access for Reddit to enable bulk meme fetching.

## 📋 Overview

To fetch memes from Reddit, you'll need to register an application and obtain API credentials. This process is free for basic usage but may have rate limits.

---

## 🔴 Reddit API Setup

Reddit requires OAuth2 authentication for API access. Here's how to set it up:

### Step 1: Create a Reddit Account
1. Go to [reddit.com](https://www.reddit.com) and create an account if you don't have one
2. Verify your email address

### Step 2: Register Your Application
1. Go to [https://www.reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Scroll to the bottom and click **"create another app..."** or **"are you a developer? create an app..."**
3. Fill in the form:
   - **name**: `meme-busters` (or any name you prefer)
   - **App type**: Select **"web app"**
   - **description**: `download and analyze memes`
   - **about url**: `https://www.meme-busters.com/`
   - **redirect uri**: `https://www.meme-busters.com/api/auth/reddit/callback`
4. Click **"create app"**

### Step 3: Get Your Credentials
After creating the app, you'll see:
- **client_id**: The string under your app name (looks like: `rsR3upQEE5hHobaKQuXYmA`)
- **secret**: The "secret" field (looks like: `S3IUASMVSW_XoI8M0mx9-SV0i1bHzw`)

### Step 4: Add to Environment Variables
Add these to your Vercel project environment variables (via the **Vars** section in v0):

\`\`\`
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_REDIRECT_URI=https://www.meme-busters.com/api/auth/reddit/callback
REDDIT_USER_AGENT=web:meme-busters.com:v1.0.0 (by /u/your_reddit_username)
\`\`\`

**Important**: Replace `your_reddit_username` with your actual Reddit username in the User-Agent string.

### Rate Limits
- Free tier: 60 requests per minute
- Sufficient for most use cases

---

## 🚀 Adding Environment Variables to Vercel

### Method 1: Through v0 Interface (Recommended)
1. In the v0 chat, click the sidebar icon
2. Go to **"Vars"** section
3. Add each environment variable:
   - `REDDIT_CLIENT_ID`
   - `REDDIT_CLIENT_SECRET`
   - `REDDIT_REDIRECT_URI`
   - `REDDIT_USER_AGENT`
4. The changes will be automatically synced to your Vercel project

### Method 2: Through Vercel Dashboard
1. Go to your project on [vercel.com](https://vercel.com)
2. Click on **"Settings"** tab
3. Click on **"Environment Variables"** in the sidebar
4. Add each variable:
   - Enter the **Key** (e.g., `REDDIT_CLIENT_ID`)
   - Enter the **Value** (your actual credential)
   - Select environments: **Production**, **Preview**, and **Development**
5. Click **"Save"**
6. Redeploy your application for changes to take effect

---

## ✅ Verification

After adding all environment variables, you can verify they're working by:

1. Going to the **Fetch Memes** page in your app
2. The Reddit sources should now be available
3. Try the **Quick Fill** feature to test all sources at once

---

## 🔒 Security Best Practices

1. **Never commit API keys to Git**: Always use environment variables
2. **Rotate keys regularly**: If you suspect a key has been compromised, regenerate it
3. **Use different keys for development and production**: Create separate apps for each environment
4. **Monitor usage**: Check your API dashboards regularly for unusual activity
5. **Respect rate limits**: Implement proper error handling and backoff strategies

---

## 📚 Additional Resources

- [Reddit API Documentation](https://www.reddit.com/dev/api/)
- [Reddit OAuth2 Guide](https://github.com/reddit-archive/reddit/wiki/OAuth2)

---

## 🆘 Troubleshooting

### Reddit Issues
- **403 Forbidden**: Check your User-Agent string includes your Reddit username
- **401 Unauthorized**: Verify your client_id and client_secret are correct
- **429 Too Many Requests**: You've hit the rate limit, wait before retrying
- **Invalid redirect_uri**: Make sure the redirect URI in your app settings matches the environment variable

---

## 📞 Support

If you encounter issues:
1. Check the Reddit API status page
2. Review your environment variables for typos
3. Check the browser console and server logs for error messages
4. Consult the official Reddit API documentation
