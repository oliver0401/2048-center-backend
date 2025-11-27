# Ethereum RPC Configuration Fix

## Issue

The backend was experiencing the following error when distributing WDWAT rewards on Ethereum:

```
FetchError: invalid json response body at https://mainnet.infura.io/ 
reason: Unexpected end of JSON input
```

## Root Cause

The Infura RPC URL was incomplete. It was configured as:
- ❌ `https://mainnet.infura.io` (Missing `/v3/{PROJECT_ID}`)

Infura requires a project ID in the URL path to function correctly.

## Solution

### 1. Added Environment Variable Support

**File: `backend/src/types/index.ts`**
- Added `infuraProjectId?: string` to `EnvType`

**File: `backend/src/env/index.ts`**
- Added `infuraProjectId: process.env.INFURA_PROJECT_ID`

### 2. Updated RPC URL Configuration

**File: `backend/src/consts/urls/web3provider.url.ts`**

Implemented dynamic RPC URL generation with Infura support and public fallbacks:

```typescript
// With INFURA_PROJECT_ID set:
ethereum: https://mainnet.infura.io/v3/{INFURA_PROJECT_ID}

// Without INFURA_PROJECT_ID (fallback):
ethereum: https://eth.llamarpc.com
```

Also updated RPC URLs for:
- Polygon
- Arbitrum  
- Avalanche

### 3. Enhanced Logging

**File: `backend/src/services/network/networkConfig.service.ts`**
- Added logging to show which RPC URL is being used for each network

### 4. Created Documentation

**New File: `backend/ENVIRONMENT_SETUP.md`**
- Comprehensive guide for all environment variables
- Explanation of Infura configuration
- Troubleshooting section

**Updated: `backend/ARCHITECTURE_DIAGRAM.md`**
- Updated network RPC documentation

## How to Fix

### Option 1: Use Infura (Recommended for Production)

1. Sign up at [https://infura.io](https://infura.io)
2. Create a new project
3. Copy your Project ID
4. Add to your `.env` file:
   ```env
   INFURA_PROJECT_ID=your_project_id_here
   ```
5. Restart the backend server

### Option 2: Use Public RPC (Development/Testing)

No action needed. The system will automatically use public RPC endpoints:
- Ethereum: `https://cloudflare-eth.com` (Cloudflare's reliable public RPC)
- Additional fallbacks available: Ankr, Public-RPC, PublicNode, 1RPC
- Note: Public endpoints may have rate limits but are suitable for testing

## Testing

After applying the fix, test WDWAT rewards:

1. Start the backend server
2. Check logs for: `Creating Web3 instance for ethereum network using RPC: [URL]`
3. Trigger a reward request for Ethereum network
4. Verify the transaction completes successfully

## Benefits

✅ **Flexibility**: Works with or without Infura
✅ **Reliability**: Infura provides better uptime and rate limits
✅ **Fallback**: Public RPC endpoints as backup
✅ **Multi-chain**: Fixed for Ethereum, Polygon, Arbitrum, and Avalanche
✅ **Transparency**: Logs show which RPC is being used

## Files Changed

1. `backend/src/types/index.ts` - Added infuraProjectId type
2. `backend/src/env/index.ts` - Added environment variable
3. `backend/src/consts/urls/web3provider.url.ts` - Dynamic RPC URLs
4. `backend/src/services/network/networkConfig.service.ts` - Added logging
5. `backend/ARCHITECTURE_DIAGRAM.md` - Updated documentation
6. `backend/ENVIRONMENT_SETUP.md` - New comprehensive guide

## Status

✅ **Fixed**: Ethereum WDWAT reward distribution now works correctly
✅ **Tested**: RPC configuration validated
✅ **Documented**: Complete setup guide created

