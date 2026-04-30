export const STORAGE_KEY = "hillCruzeProfileV2";

export const WORLD = {
    width: 1920,
    height: 1080,
    trackMinX: 280,
    trackMaxX: 1580,
    riderBaseX: 460
};

export const RUN_CONFIG = {
    baseSpeed: 500,
    maxBonusSpeed: 430,
    boostMultiplier: 1.38,
    jumpVelocity: 1120,
    gravity: 2550,
    countdownDuration: 2.6,
    warmupDuration: 3.6,
    milestoneSpacing: 620,
    patternInterval: [1350, 1900],
    coinInterval: [650, 1050],
    powerupInterval: [6400, 9800]
};

export const BIOMES = [
    {
        id: "savanna",
        label: "Savanna Dawn",
        summary: "Open grassland, warm dust, and clear sunrise contrast.",
        accent: "#ffb347",
        skyTop: 0x071424,
        skyMid: 0x1f4960,
        skyBottom: 0xd8823d,
        glow: 0xffd166,
        laneTint: 0xb56b2f,
        ridgeTint: 0x7c4a22,
        canopyTint: 0x354f2f
    },
    {
        id: "highlands",
        label: "Highland Redline",
        summary: "Red-earth ridges and deep green highland edges.",
        accent: "#ef8354",
        skyTop: 0x081421,
        skyMid: 0x263a52,
        skyBottom: 0xb64f32,
        glow: 0xef8354,
        laneTint: 0xa44a28,
        ridgeTint: 0x6a2b15,
        canopyTint: 0x3f6d40
    },
    {
        id: "dunes",
        label: "Namib Drift",
        summary: "Wide dune walls and hot, wind-cut horizon bands.",
        accent: "#ffd166",
        skyTop: 0x0b1625,
        skyMid: 0x31516a,
        skyBottom: 0xe0a84b,
        glow: 0xffd166,
        laneTint: 0xa86a30,
        ridgeTint: 0x704621,
        canopyTint: 0x8a6b3d
    },
    {
        id: "canopy",
        label: "Canopy Rush",
        summary: "Lush green climbs with saturated cloud breaks.",
        accent: "#78c091",
        skyTop: 0x06151a,
        skyMid: 0x174331,
        skyBottom: 0x4f8760,
        glow: 0x78c091,
        laneTint: 0x456a45,
        ridgeTint: 0x27422d,
        canopyTint: 0x173526
    },
    {
        id: "coast",
        label: "Escarpment Coast",
        summary: "Rocky cliff faces and cool ocean light at the edge.",
        accent: "#7cc6fe",
        skyTop: 0x071521,
        skyMid: 0x1f536f,
        skyBottom: 0x79a7b8,
        glow: 0x7cc6fe,
        laneTint: 0x4c6577,
        ridgeTint: 0x233646,
        canopyTint: 0x2f5166
    }
];

export const COSMETICS = {
    badges: [
        { id: "rookie", label: "Trail Starter", summary: "First ride profile." },
        { id: "steady", label: "Steady Climber", summary: "Built from clean early runs." },
        { id: "sprinter", label: "Open Road Sprinter", summary: "Unlocked by stronger score pace." },
        { id: "ridge", label: "Ridge Master", summary: "Distance and score are both climbing." },
        { id: "summit", label: "Summit Chaser", summary: "Long-term mastery badge." }
    ]
};

export const PROFILE_KEYS = {
    badges: "unlockedBadges"
};

export const SELECTED_KEYS = {
    badges: "selectedBadge"
};

export const UNLOCKS = [
    { kind: "badges", id: "steady", score: 4000, distance: 700 },
    { kind: "badges", id: "sprinter", score: 14000, distance: 2200 },
    { kind: "badges", id: "ridge", score: 36000, distance: 6200 },
    { kind: "badges", id: "summit", score: 90000, distance: 14000 }
];

export const DEFAULT_PROFILE = {
    version: 2,
    bestScore: 0,
    longestDistance: 0,
    totalScore: 0,
    totalDistance: 0,
    totalRuns: 0,
    totalCoins: 0,
    unlockedBadges: ["rookie"],
    selectedBadge: "rookie"
};

export function getCatalogItem(kind, id) {
    return COSMETICS[kind].find((entry) => entry.id === id) || COSMETICS[kind][0];
}

export function getBiome(id) {
    return BIOMES.find((biome) => biome.id === id) || BIOMES[0];
}

export function formatInteger(value) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.floor(value));
}
