# RPC Logging and Debugging Guide

## Overview

The backend now includes comprehensive logging to track all RPC server interactions and diagnose issues with blockchain network connections.

## What's Logged

### 1. Request Level Logging
**Location**: `controllers/reward/sendReward.controller.ts`

```
============================================================
REWARD DISTRIBUTION REQUEST RECEIVED
============================================================
Timestamp: 2024-01-01T12:00:00.000Z
Network: ethereum
Recipient: 0x1234...
Token Amount: 44
Request IP: 192.168.1.1
============================================================
```

### 2. Web3 Instance Configuration
**Location**: `services/network/networkConfig.service.ts`

```
=== Web3 Instance Configuration ===
Network: ETHEREUM
RPC URL: https://mainnet.infura.io/v3/YOUR_PROJECT_ID
Native Token: ETH
✓ Using Infura with Project ID: 9aa3d95b...
Web3 Configuration:
  Transaction Timeout: 60 seconds
  Polling Interval: 1 second
  Required Confirmations: 1 block
===================================
```

### 3. Validation Phase
**Location**: `services/reward/strategies/EthereumRewardStrategy.ts`

```
=== Ethereum Network Validation Started ===
Signer Address: 0x5678...
Testing RPC connection...
✓ RPC Connection successful. Current block: 19123456
Initializing WDWAT contract at: 0xABCD...
Fetching WDWAT balance...
WDWAT Balance: 1000.5 WDWAT
Required Amount: 44 WDWAT
✓ Sufficient WDWAT balance confirmed
✓ Ethereum Network: All prerequisites validated
=== Validation Complete ===
```

### 4. Distribution Phase
```
=== Ethereum Reward Distribution Started ===
Using signer address: 0x5678...
Fetching transaction nonce...
✓ Nonce: 42
Calculating optimal gas price...
✓ Gas Price: 25.5 Gwei
Initializing WDWAT contract at: 0xABCD...
Encoding transfer transaction...
  To: 0xeb2C7...
  Amount: 44 WDWAT
✓ Transaction data encoded (196 bytes)
Signing transaction...
✓ Transaction signed
Broadcasting transaction to network...
✓ Transaction mined!
  Transaction Hash: 0x789...
  Block Number: 19123457
  Gas Used: 65000
  Status: Success
=== Distribution Complete ===
```

### 5. Success Response
```
============================================================
REWARD DISTRIBUTION SUCCESSFUL ✓
============================================================
Network: ETHEREUM
Transactions:
  ✓ WDWAT: 44
    TX Hash: 0x789...
Timestamp: 2024-01-01T12:00:30.000Z
============================================================
```

### 6. Error Logging
```
============================================================
REWARD DISTRIBUTION FAILED ✗
============================================================
Timestamp: 2024-01-01T12:00:30.000Z
Error Type: FetchError
Error Message: invalid json response body...

Stack Trace:
  at C:\...\node-fetch\lib\index.js:273:32
  ...

Full Error Object:
{
  "type": "invalid-json",
  "message": "invalid json response body...",
  ...
}
============================================================
```

## Common Issues and What to Look For

### Issue 1: Invalid JSON Response

**Log Pattern:**
```
✗ RPC Connection failed:
  Error Type: FetchError
  Error Message: invalid json response body at https://...
```

**Cause**: RPC endpoint URL is incorrect or Infura Project ID is missing

**Solution**: 
1. Check for this warning:
   ```
   ⚠️  CRITICAL WARNING: INFURA_PROJECT_ID not set!
   ```
2. Set `INFURA_PROJECT_ID` in your `.env` file
3. Restart the backend

### Issue 2: Connection Timeout

**Log Pattern:**
```
Testing RPC connection...
(hangs here for 60 seconds)
✗ RPC Connection failed:
  Error Message: timeout...
```

**Cause**: RPC endpoint is unreachable or slow

**Solution**:
1. Check your internet connection
2. Verify RPC URL is correct
3. Try alternative RPC endpoints

### Issue 3: Insufficient Balance

**Log Pattern:**
```
WDWAT Balance: 10.5 WDWAT
Required Amount: 44 WDWAT
Error: Insufficient WDWAT balance for reward
```

**Cause**: Signer wallet doesn't have enough tokens

**Solution**: Fund the signer wallet with more WDWAT tokens

### Issue 4: Transaction Fails to Mine

**Log Pattern:**
```
Broadcasting transaction to network...
(hangs here)
⚠ WDWAT transaction timeout - transaction may still be pending
```

**Cause**: Network congestion or gas price too low

**Solution**:
1. Check transaction on blockchain explorer
2. Increase gas price settings
3. Wait for network congestion to clear

## Debugging Steps

### Step 1: Check RPC Connection

Look for:
```
✓ RPC Connection successful. Current block: XXXXXXX
```

If you see an error here, the RPC endpoint is not working.

### Step 2: Verify Configuration

Look for:
```
✓ Using Infura with Project ID: 9aa3d95b...
```

If you see a warning instead, set up Infura.

### Step 3: Check Balance

Look for:
```
WDWAT Balance: XXX.X WDWAT
Required Amount: XX WDWAT
✓ Sufficient WDWAT balance confirmed
```

### Step 4: Monitor Transaction

Look for:
```
✓ Transaction mined!
  Transaction Hash: 0x...
  Status: Success
```

## Log Levels Explained

- `✓` - Success/confirmation
- `⚠️` - Warning (non-critical)
- `✗` - Error/failure
- Plain text - Informational

## Tips for Production

1. **Always use Infura for Ethereum**
   - Free tier: 100k requests/day
   - Sign up at https://infura.io

2. **Monitor logs regularly**
   - Check for warnings about missing configuration
   - Look for patterns in failures

3. **Save transaction hashes**
   - All successful transactions log their hash
   - Use for verification and debugging

4. **Check block explorer**
   - If transaction times out, it may still succeed
   - Use the logged transaction hash to check status

## Environment Variables Checklist

Before running in production, verify these are set:

- ✅ `INFURA_PROJECT_ID` - For Ethereum RPC access
- ✅ `ETH_DWAT_SIGNER_KEY` - For signing Ethereum transactions
- ✅ `FUSE_DWAT_SIGNER_KEY` - For signing Fuse transactions
- ✅ `FUSE_SIGNER_KEY` - For native FUSE token transactions

## Getting Help

If you see an error and can't resolve it:

1. Copy the entire error block (between the `===` lines)
2. Note the timestamp
3. Check the transaction hash (if available) on blockchain explorer
4. Review the "Full Error Object" for technical details

