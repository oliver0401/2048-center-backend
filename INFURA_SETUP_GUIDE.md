# Infura Setup Guide - Recommended for Ethereum Network

## Why Use Infura?

Public RPC endpoints are great for testing, but for production use on Ethereum, **Infura is strongly recommended** because:

✅ **Reliability**: 99.9% uptime SLA  
✅ **Performance**: Faster response times  
✅ **Rate Limits**: Higher rate limits (100k requests/day on free tier)  
✅ **Monitoring**: Dashboard to track usage  
✅ **Support**: Professional support available  

## Quick Setup (5 minutes)

### Step 1: Create Infura Account

1. Go to [https://infura.io](https://infura.io)
2. Click "Sign Up" (free account available)
3. Verify your email address

### Step 2: Create a Project

1. After logging in, click "Create New Key"
2. Select "Web3 API (Formerly Ethereum)"
3. Give your project a name (e.g., "EvoFuse 2048 Backend")
4. Click "Create"

### Step 3: Get Your Project ID

1. Click on your newly created project
2. You'll see your **PROJECT ID** on the project page
3. Copy this ID (it looks like: `9aa3d95b3bc440fa88ea12eaa4456161`)

### Step 4: Add to Environment Variables

Add this line to your `.env` file in the `backend` directory:

```env
INFURA_PROJECT_ID=your_project_id_here
```

Replace `your_project_id_here` with the actual project ID you copied.

### Step 5: Restart Backend

```bash
# Stop your backend server (Ctrl+C)
# Then restart it
cd backend
bun run dev
```

### Step 6: Verify

When you trigger an Ethereum reward, you should see in the logs:

```
Creating Web3 instance for ethereum network using RPC: https://mainnet.infura.io/v3/YOUR_PROJECT_ID
```

## Supported Networks with Infura

Your Infura project ID will work with these networks:
- ✅ Ethereum Mainnet
- ✅ Polygon
- ✅ Arbitrum
- ✅ Avalanche

## Free Tier Limits

Infura's free tier includes:
- **100,000 requests per day**
- **10 requests per second**
- **Core Ethereum endpoints**

This is more than enough for most applications!

## Troubleshooting

### "Invalid project ID" error

**Problem**: The project ID is incorrect or not properly set  
**Solution**: Double-check the project ID in your `.env` file and ensure there are no extra spaces

### Still seeing public RPC in logs

**Problem**: Environment variable not loaded  
**Solution**: Restart your backend server completely

### Want to use different networks

**Problem**: Need to add more networks to your Infura project  
**Solution**: In Infura dashboard, go to Settings → Endpoints and enable additional networks

## Cost (Optional)

If you need more than 100k requests/day:
- **Core Plan**: $50/month - 3M requests/day
- **Growth Plan**: $225/month - 100M requests/day
- **Enterprise**: Custom pricing

For most projects, the **free tier is sufficient**.

## Alternative: Alchemy

If you prefer, [Alchemy](https://www.alchemy.com/) is another excellent option:
- Similar reliability and features
- Free tier: 300M compute units/month
- Setup is nearly identical

To use Alchemy:
1. Get your API key from Alchemy
2. Set: `INFURA_PROJECT_ID=your_alchemy_api_key`
3. Update the RPC URL format in `web3provider.url.ts`

## Summary

🎯 **Recommended for**: Production environments  
🆓 **Cost**: Free tier is sufficient for most use cases  
⏱️ **Setup Time**: 5 minutes  
✅ **Result**: Reliable Ethereum network access  

For development/testing, the public RPC fallback works fine, but for production deployments, **please use Infura**.

