# Services Layer

This directory contains business logic services for the EvoFuse 2048 application.

## 📁 Directory Structure

```
services/
├── network/              # Network configuration and management
│   ├── networkConfig.service.ts
│   └── index.ts
├── reward/              # Reward distribution system
│   ├── RewardService.ts
│   ├── strategies/      # Network-specific reward strategies
│   │   ├── IRewardStrategy.ts
│   │   ├── FuseRewardStrategy.ts
│   │   ├── EthereumRewardStrategy.ts
│   │   └── index.ts
│   └── index.ts
├── balance.service.ts   # Balance checking
├── calc.service.ts      # Calculations
├── monitor.service.ts   # Monitoring
├── openai.service.ts    # OpenAI integration
├── record.service.ts    # Record management
├── reward.service.ts    # Legacy reward service (deprecated)
├── runware.service.ts   # Runware integration
├── subscribe.service.ts # Subscription management
├── theme.service.ts     # Theme management
├── user.service.ts      # User management
└── index.ts             # Main exports
```

## 🎯 Service Overview

### Network Services
**Location**: `network/`

Handles blockchain network configuration and Web3 instance management.

**Key Features**:
- Multi-network support (Fuse, Ethereum)
- Centralized RPC configuration
- Web3 instance factory

**Usage**:
```typescript
import { NetworkConfigService } from 'services';

const config = NetworkConfigService.getNetworkConfig('ethereum');
const web3 = NetworkConfigService.createWeb3Instance('fuse');
```

### Reward Services
**Location**: `reward/`

Manages reward distribution across multiple blockchain networks using the Strategy Pattern.

**Key Features**:
- Multi-network reward distribution
- Balance validation
- Gas optimization
- Transaction management

**Supported Networks**:
- **Fuse**: DWAT + FUSE native token
- **Ethereum**: WDWAT only (no ETH)

**Usage**:
```typescript
import { RewardService } from 'services';

const service = new RewardService();
const result = await service.distributeReward({
  recipientAddress: '0x...',
  tokenAmount: '100',
  network: 'ethereum'
});
```

## 🔧 Adding New Services

1. Create your service file: `myService.service.ts`
2. Export from `index.ts`:
   ```typescript
   export * from './myService.service';
   ```
3. Use in controllers:
   ```typescript
   import { MyService } from 'services';
   ```

## 📚 Documentation

For detailed reward system documentation, see:
- `../../REWARD_SYSTEM_ARCHITECTURE.md` - Architecture details
- `../../MIGRATION_GUIDE.md` - Migration guide
- `../../ARCHITECTURE_DIAGRAM.md` - Visual diagrams
- `../../REFACTORING_SUMMARY.md` - Summary

## 🎨 Design Patterns

### Strategy Pattern
Used in the reward system to handle different network reward mechanisms.

```
IRewardStrategy (Interface)
    ↓
├─ FuseRewardStrategy
└─ EthereumRewardStrategy
```

### Service Layer Pattern
Controllers delegate business logic to services, keeping them thin and focused.

```
Controller → Service → Strategy/Logic → Blockchain/DB
```

## 🧪 Testing

Each service should have corresponding test files:
```
services/
├── network/
│   ├── networkConfig.service.ts
│   └── networkConfig.service.spec.ts  # Unit tests
└── reward/
    ├── RewardService.ts
    └── RewardService.spec.ts          # Unit tests
```

## 💡 Best Practices

1. **Single Responsibility**: Each service should handle one domain
2. **Dependency Injection**: Pass dependencies in constructor
3. **Error Handling**: Throw descriptive errors
4. **Type Safety**: Use TypeScript interfaces
5. **Async/Await**: Use for asynchronous operations
6. **Logging**: Log important operations
7. **Documentation**: Add JSDoc comments

## 🔒 Security

- Never log sensitive data (private keys, passwords)
- Validate all inputs
- Use environment variables for secrets
- Handle errors gracefully

## 📝 Migration Notes

### Deprecated Services

- `reward.service.ts` - **DEPRECATED**, use `reward/RewardService.ts` instead

The new reward system provides:
- Better modularity
- Multi-network support
- Improved error handling
- Better testability

