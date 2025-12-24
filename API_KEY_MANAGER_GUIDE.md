# CyberForge API Key Manager - User Guide

## Overview
The API Key Manager allows you to manage multiple Google Gemini API keys within CyberForge. This is useful for:
- Switching between different Google accounts
- Avoiding rate limits by rotating keys
- Managing personal and work API keys separately

## How to Access
1. Look for the **key icon button** (🔑) in the top-right header area, next to "Identity_Console"
2. The button will be **red and pulsing** if no API key is configured
3. The button will be **cyan/blue** when an API key is active
4. Click the key icon to open the API Key Manager

## Adding an API Key

1. Click the **"+ ADD NEW API KEY"** button
2. Enter a **name** for your key (e.g., "Personal Account", "Work Key", "Account 1")
3. Paste your **Google Gemini API key**
4. Click **"SAVE"**

Your first API key will automatically become the active key.

## Managing API Keys

### Viewing Your Keys
- All your saved API keys are listed in the manager
- The **active key** is highlighted with a green background and "ACTIVE" badge
- Keys are masked for security (only first 4 and last 4 characters shown)

### Switching Keys
1. Find the key you want to use
2. Click **"SET ACTIVE"**
3. The app will now use this key for all API calls

### Editing a Key
1. Click **"EDIT"** on the key you want to modify
2. Update the name or API key value
3. Click **"SAVE"** to confirm changes

### Deleting a Key
1. Click **"DELETE"** on the key you want to remove
2. Confirm the deletion
3. If you delete the active key, the first remaining key becomes active

## Active Key Display

When an API key is active, you'll see:
- **Status: SYNCED** in the Identity Console
- **Key: [Your Key Name]** displayed in pink/magenta text below the status

## Getting a Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" in the left sidebar
4. Create a new API key or use an existing one
5. Copy the key and paste it into CyberForge

## Storage

- All API keys are stored **locally** in your browser's localStorage
- Keys are **never sent** to any server except Google's Gemini API
- Clearing your browser data will remove stored keys

## Troubleshooting

### "No API key configured" Error
- Open the API Key Manager
- Add at least one API key
- Make sure it's set as active

### Rate Limit (429) Errors
- Add multiple API keys from different Google accounts
- Switch to a different key when you hit rate limits
- Wait a few minutes before retrying

### API Key Not Working
- Verify the key is correct (no extra spaces)
- Check that the key has Gemini API access enabled
- Try generating a new key in Google AI Studio

## Security Tips

- Don't share your API keys with anyone
- Use different keys for different projects
- Regularly rotate your keys
- Delete unused keys from the manager
