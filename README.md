# FruitSlash 🍉

A fast-paced fruit slashing game built on the **Base blockchain**. Slash fruits, dodge bombs, and compete on the on-chain leaderboard.

## Tech Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** for styling
- **wagmi v2** + **viem v2** for contract interaction
- **Privy** for wallet auth (smart wallet support)
- **HTML5 Canvas** for 60fps game rendering
- **Web Audio API** for synthesized sound effects
- **Solidity 0.8.20** + OpenZeppelin for smart contracts

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXT_PUBLIC_PRIVY_APP_ID` - Get from [privy.io](https://privy.io)
- `NEXT_PUBLIC_CONTRACT_ADDRESS` - After deploying the contract
- `NEXT_PUBLIC_ALCHEMY_API_KEY` - For RPC access

### 3. Deploy the contract

```bash
cd contracts
npm install
npx hardhat run scripts/deploy.ts --network baseSepolia
```

Copy the deployed address into your `.env.local`.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Game Mechanics

- **60-second rounds** of fruit-slashing action
- **8 fruit types** with different point values
- **Combo system** - chain slices within 500ms for multipliers up to 8x
- **Bombs** - hitting one ends the game instantly
- **Power-ups**: Freeze Time, Double Points, Fruit Frenzy
- **On-chain high scores** - only saves if you beat your record (gas efficient)

## Smart Contract

The `FruitSlash.sol` contract handles:
- **Score submission** with validation
- **Top 100 leaderboard** maintained on-chain
- **Player tracking** with total games played

## Project Structure

```
├── app/
│   ├── game/page.tsx         # Game canvas page
│   ├── leaderboard/page.tsx  # Leaderboard page
│   ├── layout.tsx            # Root layout + providers
│   ├── page.tsx              # Landing page
│   ├── providers.tsx         # Privy + wagmi + React Query
│   └── globals.css
├── components/
│   ├── game/
│   │   ├── GameCanvas.tsx    # Main canvas renderer
│   │   ├── GameOverlay.tsx   # Start/game-over screens
│   │   └── ScoreDisplay.tsx  # HUD overlay
│   └── ui/
│       ├── ConnectButton.tsx
│       └── Header.tsx
├── contracts/
│   ├── FruitSlash.sol
│   └── scripts/deploy.ts
├── hooks/
│   ├── useGame.ts            # Game loop + state
│   ├── useLeaderboard.ts     # Contract reads
│   └── useWallet.ts          # Wallet + contract writes
├── lib/
│   ├── constants.ts          # ABI, configs, fruit data
│   ├── gameUtils.ts          # Physics, rendering, collision
│   └── sounds.ts             # Web Audio sound effects
└── public/
    ├── basedev.json          # base.dev metadata
    ├── manifest.json         # PWA manifest
    └── assets/
```

## Mobile Optimization

- Touch-optimized slash detection
- Full-viewport canvas with DPR scaling
- Scroll/zoom prevention during gameplay
- Haptic feedback on slice
- Synthesized audio (no file loading latency)
- 60fps target with `requestAnimationFrame`

## Deployment

Build and deploy to Vercel:

```bash
npm run build
```

## base.dev Publishing

1. Add icon assets: `public/icon-192.png`, `public/icon-512.png`
2. Add OG image: `public/og-image.png` (1200x630)
3. Add screenshots in `public/screenshots/`
4. Update `public/basedev.json` with contract address and URLs
5. Submit at [base.dev](https://base.dev)

## License

MIT
