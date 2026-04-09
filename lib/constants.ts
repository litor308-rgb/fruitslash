import { base } from "wagmi/chains";

export const ACTIVE_CHAIN = base;

export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";

export const PAYMASTER_URL =
  process.env.NEXT_PUBLIC_PAYMASTER_URL ?? "";

export const FRUIT_SLASH_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  // --- Write functions ---
  {
    inputs: [],
    name: "slash",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "checkIn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "score", type: "uint256" }],
    name: "submitScore",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // --- Read functions ---
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "highScores",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "totalSlashes",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "hasFruitNFT",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalPlayers",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSlashCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getCheckInInfo",
    outputs: [
      { internalType: "uint256", name: "lastCheckIn", type: "uint256" },
      { internalType: "uint256", name: "streak", type: "uint256" },
      { internalType: "uint256", name: "totalCheckIns", type: "uint256" },
      { internalType: "bool", name: "checkedInToday", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "limit", type: "uint256" }],
    name: "getTopScores",
    outputs: [
      {
        components: [
          { internalType: "address", name: "player", type: "address" },
          { internalType: "uint256", name: "score", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct FruitSlash.Score[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getLeaderboardLength",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // --- Events ---
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "uint256", name: "totalSlashes", type: "uint256" },
    ],
    name: "Slashed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "FruitNFTMinted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "uint256", name: "streak", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "totalCheckIns", type: "uint256" },
    ],
    name: "CheckedIn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "uint256", name: "score", type: "uint256" },
    ],
    name: "ScoreSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "uint256", name: "rank", type: "uint256" },
    ],
    name: "LeaderboardUpdated",
    type: "event",
  },
] as const;

export const GAME_CONFIG = {
  ROUND_DURATION: 60,
  SPAWN_INTERVAL_MS: 1000,
  SPAWN_INTERVAL_MIN_MS: 500,
  GRAVITY: 0.35,
  FRUIT_RADIUS: 35,
  BOMB_CHANCE: 0.1,
  POWERUP_CHANCE: 0.06,
  MAX_FRUITS_ON_SCREEN: 6,
  COMBO_WINDOW_MS: 500,
  COMBO_MULTIPLIER_MAX: 8,
  SLASH_MIN_DISTANCE: 20,
  CANVAS_PADDING: 40,
} as const;

export type FruitType =
  | "apple"
  | "banana"
  | "watermelon"
  | "orange"
  | "strawberry"
  | "pineapple"
  | "kiwi"
  | "mango";

export type PowerUpType = "freeze" | "doublePoints" | "frenzy";

export interface FruitConfig {
  type: FruitType;
  emoji: string;
  color: string;
  splashColor: string;
  points: number;
  radius: number;
}

export const FRUITS: FruitConfig[] = [
  { type: "apple", emoji: "🍎", color: "#FF3B3B", splashColor: "#FF6B6B", points: 10, radius: 32 },
  { type: "banana", emoji: "🍌", color: "#FFD700", splashColor: "#FFED4A", points: 10, radius: 30 },
  { type: "watermelon", emoji: "🍉", color: "#39E75F", splashColor: "#6BF08E", points: 15, radius: 40 },
  { type: "orange", emoji: "🍊", color: "#FF8C42", splashColor: "#FFA96B", points: 10, radius: 30 },
  { type: "strawberry", emoji: "🍓", color: "#FF69B4", splashColor: "#FF99CC", points: 12, radius: 28 },
  { type: "pineapple", emoji: "🍍", color: "#FFD700", splashColor: "#FFF4A3", points: 20, radius: 38 },
  { type: "kiwi", emoji: "🥝", color: "#7EC850", splashColor: "#A8E06D", points: 12, radius: 26 },
  { type: "mango", emoji: "🥭", color: "#FF8C42", splashColor: "#FFAB70", points: 15, radius: 34 },
];

export const POWERUPS: { type: PowerUpType; emoji: string; color: string; duration: number }[] = [
  { type: "freeze", emoji: "❄️", color: "#00D4FF", duration: 3000 },
  { type: "doublePoints", emoji: "✨", color: "#FFD700", duration: 5000 },
  { type: "frenzy", emoji: "🔥", color: "#FF3B3B", duration: 4000 },
];
