export const STORAGE_KEY = "hillCruzeProfileV2";

export const WORLD = {
    width: 1920,
    height: 1080,
    trackMinX: 280,
    trackMaxX: 1580,
    riderBaseX: 460
};

export const RUN_CONFIG = {
    baseSpeed: 580,
    maxBonusSpeed: 340,
    boostMultiplier: 1.3,
    lateralAcceleration: 980,
    lateralFriction: 0.88,
    maxLateralSpeed: 440,
    jumpVelocity: 1100,
    gravity: 2500,
    milestoneSpacing: 1400,
    obstacleInterval: [1050, 1650],
    powerupInterval: [5400, 7600],
    coinInterval: [2200, 3400]
};

export const BIOMES = [
    {
        id: "savanna",
        label: "Savanna Dawn",
        summary: "Open grassland, warm dust, and sharp sunrise contrast.",
        asset: "assets/backgrounds/savanna.webp",
        accent: "#ffb347",
        laneTint: 0xb56b2f,
        ridgeTint: 0x7c4a22,
        canopyTint: 0x354f2f
    },
    {
        id: "highlands",
        label: "Highland Redline",
        summary: "Red-earth ridges and deep green highland edges.",
        asset: "assets/backgrounds/highlands.webp",
        accent: "#ef8354",
        laneTint: 0xa44a28,
        ridgeTint: 0x6a2b15,
        canopyTint: 0x3f6d40
    },
    {
        id: "dunes",
        label: "Namib Drift",
        summary: "Wide dune walls and hot, wind-cut horizon bands.",
        asset: "assets/backgrounds/dunes.webp",
        accent: "#ffd166",
        laneTint: 0xa86a30,
        ridgeTint: 0x704621,
        canopyTint: 0x8a6b3d
    },
    {
        id: "canopy",
        label: "Canopy Rush",
        summary: "Lush green climbs with saturated cloud breaks.",
        asset: "assets/backgrounds/canopy.webp",
        accent: "#78c091",
        laneTint: 0x456a45,
        ridgeTint: 0x27422d,
        canopyTint: 0x173526
    },
    {
        id: "coast",
        label: "Escarpment Coast",
        summary: "Rocky cliff faces and cool ocean light at the edge.",
        asset: "assets/backgrounds/coast.webp",
        accent: "#7cc6fe",
        laneTint: 0x4c6577,
        ridgeTint: 0x233646,
        canopyTint: 0x2f5166
    }
];

export const COSMETICS = {
    riders: [
        { id: "ember", label: "Ember Rider", accent: 0xff8f3d, suit: 0xf4c95d },
        { id: "river", label: "River Rider", accent: 0x5bc0eb, suit: 0xc9f9ff },
        { id: "forest", label: "Forest Rider", accent: 0x78c091, suit: 0xd6ffe3 }
    ],
    bikes: [
        { id: "classic", label: "Classic Frame", frame: 0x1d3557, trim: 0xffffff },
        { id: "sunset", label: "Sunset Frame", frame: 0xd96c06, trim: 0xffd166 },
        { id: "ocean", label: "Ocean Frame", frame: 0x006d77, trim: 0xa9def9 }
    ],
    badges: [
        { id: "rookie", label: "Trail Starter" },
        { id: "drifter", label: "Dune Drifter" },
        { id: "whisperer", label: "Cliff Whisperer" }
    ],
    backgroundPacks: BIOMES.map(({ id, label }) => ({ id, label }))
};

export const PROFILE_KEYS = {
    riders: "unlockedRiders",
    bikes: "unlockedBikes",
    badges: "unlockedBadges",
    backgroundPacks: "unlockedBackgroundPacks"
};

export const SELECTED_KEYS = {
    riders: "selectedRider",
    bikes: "selectedBike",
    badges: "selectedBadge",
    backgroundPacks: "selectedBackgroundPack"
};

export const UNLOCKS = [
    { kind: "riders", id: "river", cost: 250 },
    { kind: "bikes", id: "sunset", cost: 425 },
    { kind: "badges", id: "drifter", cost: 600 },
    { kind: "backgroundPacks", id: "highlands", cost: 775 },
    { kind: "riders", id: "forest", cost: 950 },
    { kind: "bikes", id: "ocean", cost: 1180 },
    { kind: "backgroundPacks", id: "dunes", cost: 1350 },
    { kind: "badges", id: "whisperer", cost: 1525 },
    { kind: "backgroundPacks", id: "canopy", cost: 1725 },
    { kind: "backgroundPacks", id: "coast", cost: 1950 }
];

export const DEFAULT_PROFILE = {
    version: 2,
    bestScore: 0,
    longestDistance: 0,
    totalCoins: 0,
    unlockedRiders: ["ember"],
    unlockedBikes: ["classic"],
    unlockedBadges: ["rookie"],
    unlockedBackgroundPacks: ["savanna"],
    selectedRider: "ember",
    selectedBike: "classic",
    selectedBadge: "rookie",
    selectedBackgroundPack: "savanna"
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
