# Reward System Architecture

## Overview

The reward system has been completely refactored to improve **modularity**, **readability**, and **reusability**. The new architecture uses the **Strategy Pattern** to handle different reward mechanisms for various blockchain networks.

## Network Support

### Fuse Network
- **Token Rewards**: DWAT (game token)
- **Native Token Rewards**: FUSE (0.005 FUSE per reward)
- **Distribution Method**: Two separate transactions
  1. DWAT tokens via Reward Contract
  2. FUSE native tokens via direct transfer

### Ethereum Network
- **Token Rewards**: WDWAT (ERC-20 standard token on Ethereum)
- **Native Token Rewards**: NONE (ETH is NOT rewarded on Ethereum)
- **Distribution Method**: Single ERC-20 transfer transaction

## Architecture

### 1. Network Configuration Service
**Location**: `backend/src/services/network/networkConfig.service.ts`

Centralized service for managing network-specific configurations:
- RPC URLs
- Native token symbols
- Native token reward amounts
- Web3 instance creation

```typescript
NetworkConfigService.getNetworkConfig("fuse")
NetworkConfigService.createWeb3Instance("ethereum")
NetworkConfigService.isValidNetwork(network)
```

### 2. Reward Strategy Pattern
**Location**: `backend/src/services/reward/strategies/`

#### IRewardStrategy (Interface)
Defines the contract for reward distribution:
- `validatePrerequisites()`: Checks balances and prerequisites
- `distributeRewards()`: Executes the reward distribution

#### FuseRewardStrategy
Implements reward distribution for Fuse Network:
- Validates DWAT and FUSE balances
- Distributes DWAT tokens via Reward Contract
- Distributes FUSE native tokens via direct transfer

#### EthereumRewardStrategy
Implements reward distribution for Ethereum Network:
- Validates WDWAT balance
- Distributes ONLY WDWAT tokens (ERC-20 transfer)
- NO ETH native token distribution

### 3. Reward Service
**Location**: `backend/src/services/reward/RewardService.ts`

Orchestrates the entire reward distribution process:
- Manages strategy selection based on network
- Coordinates Web3 instance creation
- Handles gas price strategy
- Executes validation and distribution

```typescript
const rewardService = new RewardService();
const result = await rewardService.distributeReward({
  recipientAddress: "0x...",
  tokenAmount: "100",
  network: "ethereum"
});
```

### 4. Refactored Controller
**Location**: `backend/src/controllers/reward/sendReward.controller.ts`

Clean and concise controller that:
- Validates input parameters
- Delegates to RewardService
- Handles errors gracefully
- Returns structured responses

## Benefits of Refactoring

### ✅ Modularity
- Each component has a single, well-defined responsibility
- Network-specific logic is isolated in strategies
- Easy to test individual components

### ✅ Readability
- Clear separation of concerns
- Self-documenting code with descriptive names
- Reduced complexity in controller

### ✅ Reusability
- Network configurations can be reused across the application
- Strategy pattern allows easy addition of new networks
- Reward service can be used in different contexts

### ✅ Maintainability
- Changes to one network don't affect others
- Easy to add new networks by implementing IRewardStrategy
- Centralized configuration management

### ✅ Error Handling
- Comprehensive validation before transactions
- Graceful error messages
- Better debugging with structured logging

## Adding a New Network

To add support for a new blockchain network:

1. **Add network configuration** in `NetworkConfigService`:
```typescript
newNetwork: {
  name: "newNetwork",
  rpcUrl: "https://...",
  nativeTokenSymbol: "NEW",
  nativeTokenRewardAmount: "0.01",
}
```

2. **Create a new strategy** implementing `IRewardStrategy`:
```typescript
export class NewNetworkRewardStrategy implements IRewardStrategy {
  async validatePrerequisites(context: RewardStrategyContext): Promise<void> {
    // Validate balances and prerequisites
  }

  async distributeRewards(context: RewardStrategyContext): Promise<RewardTransaction[]> {
    // Distribute rewards
  }
}
```

3. **Register the strategy** in `RewardService`:
```typescript
this.strategies.set("newNetwork", new NewNetworkRewardStrategy());
```

## Environment Variables

Required environment variables:

```env
# Fuse Network
FUSE_DWAT_SIGNER_KEY=0x...  # For DWAT token distribution
FUSE_SIGNER_KEY=0x...       # For FUSE native token distribution

# Ethereum Network
ETH_DWAT_SIGNER_KEY=0x...   # For WDWAT token distribution
```

## API Usage

### Request
```json
POST /api/reward
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5",
  "amount": "100",
  "network": "ethereum"
}
```

### Response (Ethereum)
```json
{
  "message": "Rewarded successfully",
  "network": "ethereum",
  "transactions": [
    {
      "token": "WDWAT",
      "amount": "100",
      "transactionHash": "0x..."
    }
  ]
}
```

### Response (Fuse)
```json
{
  "message": "Rewarded successfully",
  "network": "fuse",
  "transactions": [
    {
      "token": "DWAT",
      "amount": "100",
      "transactionHash": "0x..."
    },
    {
      "token": "FUSE",
      "amount": "0.005",
      "transactionHash": "0x..."
    }
  ]
}
```

## File Structure

```
backend/src/
├── services/
│   ├── index.ts
│   ├── network/
│   │   ├── index.ts
│   │   └── networkConfig.service.ts
│   └── reward/
│       ├── index.ts
│       ├── RewardService.ts
│       └── strategies/
│           ├── index.ts
│           ├── IRewardStrategy.ts
│           ├── FuseRewardStrategy.ts
│           └── EthereumRewardStrategy.ts
└── controllers/
    └── reward/
        └── sendReward.controller.ts
```

## Testing

The modular architecture makes testing straightforward:

- **Unit Tests**: Test individual strategies in isolation
- **Integration Tests**: Test RewardService with mocked Web3
- **E2E Tests**: Test the entire controller flow

## Logging

The system provides comprehensive logging:
- ✓ Network and recipient information
- ✓ Validation status
- ✓ Transaction hashes
- ✓ Error messages with context

## Security Considerations

- Private keys are securely stored in environment variables
- Balance validation before executing transactions
- Gas price optimization to prevent excessive fees
- Comprehensive error handling to prevent partial state

