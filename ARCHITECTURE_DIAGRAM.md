# Reward System Architecture Diagram

## Request Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                              │
│  POST /api/reward                                                   │
│  { address, amount, network }                                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    REWARD CONTROLLER                                │
│  sendReward.controller.ts                                           │
│  ├─ Validate input (address, amount, network)                       │
│  ├─ Check network validity                                          │
│  └─ Delegate to RewardService                                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     REWARD SERVICE                                  │
│  RewardService.ts                                                   │
│  ├─ Get appropriate strategy for network                            │
│  ├─ Create Web3 instance via NetworkConfigService                   │
│  ├─ Validate prerequisites                                          │
│  └─ Execute reward distribution                                     │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
                  ┌─────────┴──────────┐
                  │                    │
                  ▼                    ▼
    ┌──────────────────────┐  ┌──────────────────────┐
    │  FUSE STRATEGY       │  │ ETHEREUM STRATEGY    │
    │  ─────────────       │  │  ───────────────     │
    │                      │  │                      │
    │  Validate:           │  │  Validate:           │
    │  ✓ DWAT balance      │  │  ✓ WDWAT balance     │
    │  ✓ FUSE balance      │  │                      │
    │                      │  │  Distribute:         │
    │  Distribute:         │  │  • WDWAT (ERC-20)    │
    │  • DWAT (Contract)   │  │  • NO ETH            │
    │  • FUSE (Native)     │  │                      │
    └──────────┬───────────┘  └──────────┬───────────┘
               │                         │
               └────────┬────────────────┘
                        │
                        ▼
          ┌─────────────────────────┐
          │   BLOCKCHAIN NETWORKS   │
          │  ───────────────────    │
          │  • Fuse Network RPC     │
          │  • Ethereum Network RPC │
          └─────────────┬───────────┘
                        │
                        ▼
          ┌─────────────────────────┐
          │     TRANSACTIONS        │
          │  ──────────────────     │
          │  • Token transfers      │
          │  • Native transfers     │
          └─────────────┬───────────┘
                        │
                        ▼
          ┌─────────────────────────┐
          │     RESPONSE            │
          │  ──────────────────     │
          │  {                      │
          │    network,             │
          │    transactions: [...]  │
          │  }                      │
          └─────────────────────────┘
```

## Component Relationships

```
┌────────────────────────────────────────────────────────────────┐
│                    SERVICES LAYER                              │
│  ────────────────────────────────────────────────────────────  │
│                                                                │
│  ┌─────────────────────┐      ┌──────────────────────────┐    │
│  │ NetworkConfig       │      │   RewardService          │    │
│  │ Service             │◄─────│                          │    │
│  │                     │      │   ┌──────────────────┐   │    │
│  │ • getConfig()       │      │   │  Strategy Map    │   │    │
│  │ • createWeb3()      │      │   │  ──────────────  │   │    │
│  │ • isValidNetwork()  │      │   │  fuse → Fuse    │   │    │
│  └─────────────────────┘      │   │  eth → Ethereum │   │    │
│                               │   └────────┬─────────┘   │    │
│                               └────────────┼─────────────┘    │
│                                            │                  │
│  ┌─────────────────────────────────────────┼────────────┐    │
│  │         STRATEGY INTERFACE              │            │    │
│  │         ──────────────────              │            │    │
│  │         IRewardStrategy                 │            │    │
│  │         • validatePrerequisites()       │            │    │
│  │         • distributeRewards()           │            │    │
│  └─────────────────────────────────────────┼────────────┘    │
│                                            │                  │
│            ┌───────────────────────────────┼──────────┐       │
│            │                               │          │       │
│            ▼                               ▼          ▼       │
│  ┌──────────────────┐          ┌────────────────────────┐    │
│  │ FuseReward       │          │ EthereumReward         │    │
│  │ Strategy         │          │ Strategy               │    │
│  │                  │          │                        │    │
│  │ • DWAT + FUSE    │          │ • WDWAT only           │    │
│  │ • 2 transactions │          │ • 1 transaction        │    │
│  └──────────────────┘          └────────────────────────┘    │
└────────────────────────────────────────────────────────────────┘
```

## Network Flow Comparison

### Fuse Network Flow
```
┌──────────────────────────────────────────────────────────┐
│                   FUSE NETWORK                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. Validate DWAT Balance in Reward Contract             │
│     ├─ Check: RewardContract has enough DWAT            │
│     └─ Fail if: balance < requested amount              │
│                                                          │
│  2. Validate FUSE Native Token Balance                   │
│     ├─ Check: Signer has 0.005 FUSE                     │
│     └─ Fail if: balance < 0.005                         │
│                                                          │
│  3. Distribute DWAT Tokens                               │
│     ├─ Transaction 1: Call RewardContract                │
│     │   distributeReward(address, amount)               │
│     └─ Result: DWAT transferred to user                 │
│                                                          │
│  4. Distribute FUSE Native Tokens                        │
│     ├─ Transaction 2: Direct transfer                    │
│     │   from: fuseSigner → to: user                     │
│     │   value: 0.005 FUSE                               │
│     └─ Result: FUSE transferred to user                 │
│                                                          │
│  ✓ Total: 2 transactions                                 │
│  ✓ Rewards: DWAT + FUSE                                  │
└──────────────────────────────────────────────────────────┘
```

### Ethereum Network Flow
```
┌──────────────────────────────────────────────────────────┐
│                  ETHEREUM NETWORK                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. Validate WDWAT Balance                               │
│     ├─ Check: Signer has enough WDWAT                    │
│     └─ Fail if: balance < requested amount              │
│                                                          │
│  2. Distribute WDWAT Tokens (ERC-20)                     │
│     ├─ Transaction: Call WDWAT Contract                  │
│     │   transfer(address, amount)                        │
│     └─ Result: WDWAT transferred to user                │
│                                                          │
│  ✗ NO ETH Native Token Distribution                      │
│                                                          │
│  ✓ Total: 1 transaction                                  │
│  ✓ Rewards: WDWAT only                                   │
└──────────────────────────────────────────────────────────┘
```

## Key Design Patterns

### 1. Strategy Pattern
```
IRewardStrategy (Interface)
    ↑           ↑
    │           │
    │           └─── EthereumRewardStrategy
    │
    └─── FuseRewardStrategy

Benefits:
• Network-specific logic encapsulated
• Easy to add new networks
• Runtime strategy selection
```

### 2. Service Layer Pattern
```
Controller → Service → Strategy → Blockchain

Benefits:
• Separation of concerns
• Business logic in services
• Controllers stay thin
```

### 3. Configuration Service Pattern
```
NetworkConfigService
    ├─ Network configurations
    ├─ RPC URLs
    ├─ Token symbols
    └─ Reward amounts

Benefits:
• Centralized configuration
• Easy to modify network settings
• Type-safe configuration access
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────┐
│           ERROR HANDLING CHAIN                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Controller Level                            │
│     ├─ Input validation                         │
│     ├─ Network validation                       │
│     └─ Catch service errors                     │
│                                                 │
│  2. Service Level                               │
│     ├─ Strategy selection errors                │
│     ├─ Web3 initialization errors               │
│     └─ Coordination errors                      │
│                                                 │
│  3. Strategy Level                              │
│     ├─ Balance validation errors                │
│     ├─ Transaction signing errors               │
│     └─ Blockchain errors                        │
│                                                 │
│  4. Response                                    │
│     ├─ 400: Validation/Balance errors           │
│     ├─ 500: System/Configuration errors         │
│     └─ Descriptive error messages               │
└─────────────────────────────────────────────────┘
```

## Deployment Considerations

```
┌─────────────────────────────────────────────────┐
│          ENVIRONMENT CONFIGURATION              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Required Environment Variables:                │
│  ──────────────────────────────                 │
│  • FUSE_DWAT_SIGNER_KEY                         │
│  • FUSE_SIGNER_KEY                              │
│  • ETH_DWAT_SIGNER_KEY                          │
│                                                 │
│  Contract ABIs Required:                        │
│  ───────────────────────                        │
│  • TOKEN_CONTRACT_INFO (DWAT on Fuse)           │
│  • REWARD_CONTRACT_INFO (Reward on Fuse)        │
│  • WDWAT_ETH_CONTRACT_INFO (WDWAT on Ethereum)  │
│                                                 │
│  Network RPCs:                                  │
│  ─────────────                                  │
│  • Fuse: https://rpc.fuse.io                    │
│  • Ethereum: Infura (with project ID) or        │
│    Public fallback: https://eth.llamarpc.com    │
│  Note: Set INFURA_PROJECT_ID env var for       │
│  optimal performance on Ethereum network        │
└─────────────────────────────────────────────────┘
```

## Welcome Rewards System

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NEW USER REGISTRATION FLOW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User Connects Wallet                                               │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────┐                                                   │
│  │  checkAuth   │  or  ┌────────────────┐                           │
│  │    .ts       │      │  register      │                           │
│  │              │      │  .controller   │                           │
│  └──────┬───────┘      └────────┬───────┘                           │
│         │                       │                                   │
│         └───────┬───────────────┘                                   │
│                 │                                                   │
│                 ▼                                                   │
│         Is New User?                                                │
│              Yes │                                                  │
│                 ▼                                                   │
│    ┌─────────────────────────┐                                      │
│    │  sendWelcomeRewards()   │                                      │
│    │  (Non-blocking)         │                                      │
│    └────────┬────────────────┘                                      │
│             │                                                       │
│    ┌────────┴────────┐                                              │
│    │                 │                                              │
│    ▼                 ▼                                              │
│  Ethereum         Fuse                                              │
│  1000 DWAT      1000 DWAT + FUSE                                    │
│    │                 │                                              │
│    └────────┬────────┘                                              │
│             │                                                       │
│             ▼                                                       │
│    Promise.allSettled()                                             │
│    (Both networks attempted)                                        │
│             │                                                       │
│             ▼                                                       │
│    Log Results (Success/Failure)                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

WELCOME PACKAGE
───────────────
• 1000 DWAT (Ethereum Network)
• 1000 DWAT (Fuse Network)  
• 0.005 FUSE (Gas tokens)

FEATURES
────────
✓ Non-blocking: User creation succeeds regardless of rewards
✓ Parallel: Both networks processed simultaneously
✓ Resilient: One network can fail, other succeeds
✓ One-time: Only sent on first registration
✓ Logged: Full transaction details captured
```

## Testing Strategy

```
┌─────────────────────────────────────────────────┐
│              TESTING LAYERS                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Unit Tests                                     │
│  ──────────                                     │
│  • NetworkConfigService.spec.ts                 │
│  • FuseRewardStrategy.spec.ts                   │
│  • EthereumRewardStrategy.spec.ts               │
│  • RewardService.spec.ts                        │
│                                                 │
│  Integration Tests                              │
│  ─────────────────                              │
│  • RewardService with mock Web3                 │
│  • Strategy with mock contracts                 │
│  • Welcome rewards flow                         │
│                                                 │
│  E2E Tests                                      │
│  ─────────                                      │
│  • Full reward flow on testnet                  │
│  • Controller → Blockchain                      │
│  • New user welcome rewards                     │
└─────────────────────────────────────────────────┘
```

