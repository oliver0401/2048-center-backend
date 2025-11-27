# Environment Variables Setup Guide

This guide explains all environment variables required for the EvoFuse 2048 backend application.

## Database Configuration

```env
DB_HOST=localhost
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_PORT=3306
DB_NAME=your_db_name
```

## Server Configuration

```env
PORT=8000
SECRET_KEY=your_secret_key_for_jwt
EXPIRE_TIME=3600
```

- `PORT`: Server port (default: 8000)
- `SECRET_KEY`: Secret key for JWT token generation
- `EXPIRE_TIME`: JWT token expiration time in seconds (default: 3600)

## Blockchain Configuration

### Signer Private Keys

These are the private keys used to sign blockchain transactions. **IMPORTANT**: Keep these secure and never commit them to version control.

```env
ETH_DWAT_SIGNER_KEY=your_ethereum_wdwat_signer_private_key
FUSE_DWAT_SIGNER_KEY=your_fuse_dwat_signer_private_key
FUSE_SIGNER_KEY=your_fuse_native_token_signer_private_key
```

- `ETH_DWAT_SIGNER_KEY`: Private key for WDWAT token distribution on Ethereum
- `FUSE_DWAT_SIGNER_KEY`: Private key for DWAT token distribution on Fuse
- `FUSE_SIGNER_KEY`: Private key for native FUSE token distribution

**Note**: Private keys should be provided without the `0x` prefix.

### Infura Configuration (Optional but Recommended)

```env
INFURA_PROJECT_ID=your_infura_project_id
```

- **Purpose**: Provides reliable RPC access to Ethereum and other networks
- **How to get**: Sign up at [https://infura.io](https://infura.io) and create a project
- **Fallback**: If not provided, the system will use public RPC endpoints:
  - Ethereum: `https://eth.llamarpc.com`
  - Polygon: `https://polygon-rpc.com`
  - Arbitrum: `https://arb1.arbitrum.io/rpc`
  - Avalanche: `https://api.avax.network/ext/bc/C/rpc`

**Recommendation**: Use Infura for production environments for better reliability and rate limits.

## Payment Configuration

```env
STRIPE_SECRET_KEY=your_stripe_secret_key
```

- Get your Stripe secret key from [https://stripe.com/docs/keys](https://stripe.com/docs/keys)

## AI Services

```env
RUNWARE_API_KEY=your_runware_api_key
OPENAI_API_KEY=your_openai_api_key
```

- `RUNWARE_API_KEY`: API key for Runware image generation service
- `OPENAI_API_KEY`: API key for OpenAI services

## Betting System

```env
BETTING_KEY=your_betting_key
```

## Setting Up Your Environment

1. Copy the contents above to a `.env` file in the `backend` directory
2. Replace all placeholder values with your actual credentials
3. Ensure the `.env` file is listed in `.gitignore` to prevent accidental commits

## Network RPC Configuration

The system automatically configures RPC endpoints based on your environment:

### With INFURA_PROJECT_ID:
- Ethereum: `https://mainnet.infura.io/v3/{INFURA_PROJECT_ID}`
- Polygon: `https://polygon-mainnet.infura.io/v3/{INFURA_PROJECT_ID}`
- Arbitrum: `https://arbitrum-mainnet.infura.io/v3/{INFURA_PROJECT_ID}`
- Avalanche: `https://avalanche-mainnet.infura.io/v3/{INFURA_PROJECT_ID}`

### Without INFURA_PROJECT_ID (Public Fallback):
- Ethereum: `https://cloudflare-eth.com` (Cloudflare's reliable public RPC)
- Polygon: `https://polygon-rpc.com`
- Arbitrum: `https://arb1.arbitrum.io/rpc`
- Avalanche: `https://api.avax.network/ext/bc/C/rpc`
- Fuse: `https://rpc.fuse.io` (always used)

**Note**: Public Ethereum RPC has multiple fallback options for reliability.

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Rotate private keys** regularly
3. **Use environment-specific keys** (separate keys for dev/staging/production)
4. **Monitor wallet balances** to ensure sufficient funds for rewards
5. **Use Infura in production** for better reliability and monitoring

## Troubleshooting

### "Invalid JSON response" or "Unexpected end of JSON input"

This error typically occurs when:
- `INFURA_PROJECT_ID` is not set and public RPC endpoints are rate-limited
- Network connectivity issues

**Solution**: Set up an Infura account and add your `INFURA_PROJECT_ID` to the `.env` file.

### "Insufficient balance for reward"

**Solution**: Ensure the signer wallets have sufficient token balances:
- ETH WDWAT signer needs WDWAT tokens + ETH for gas
- Fuse DWAT signer needs DWAT tokens + FUSE for gas
- Fuse native signer needs FUSE tokens

### Transaction timeout errors

**Solution**: 
- Check network congestion
- Verify RPC endpoint is responsive
- Consider using Infura for better reliability

