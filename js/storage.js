import {
    COSMETICS,
    DEFAULT_PROFILE,
    PROFILE_KEYS,
    SELECTED_KEYS,
    STORAGE_KEY,
    UNLOCKS,
    getCatalogItem
} from "./config.js";

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

function sanitizeProfile(rawProfile) {
    const profile = {
        ...deepClone(DEFAULT_PROFILE),
        ...(rawProfile || {})
    };

    for (const [kind, unlockedKey] of Object.entries(PROFILE_KEYS)) {
        const defaultValue = deepClone(DEFAULT_PROFILE[unlockedKey]);
        const allowedIds = new Set(COSMETICS[kind].map((item) => item.id));
        const unlocked = Array.isArray(profile[unlockedKey]) ? profile[unlockedKey] : [];
        const sanitized = [...new Set([...defaultValue, ...unlocked.filter((id) => allowedIds.has(id))])];
        profile[unlockedKey] = sanitized;

        const selectedKey = SELECTED_KEYS[kind];
        if (!sanitized.includes(profile[selectedKey])) {
            profile[selectedKey] = sanitized[0];
        }
    }

    profile.bestScore = Number(profile.bestScore) || 0;
    profile.longestDistance = Number(profile.longestDistance) || 0;
    profile.totalCoins = Number(profile.totalCoins) || 0;
    profile.version = DEFAULT_PROFILE.version;

    for (const unlock of UNLOCKS) {
        const unlockedKey = PROFILE_KEYS[unlock.kind];
        if (profile.totalCoins >= unlock.cost && !profile[unlockedKey].includes(unlock.id)) {
            profile[unlockedKey].push(unlock.id);
        }
    }

    return profile;
}

export function getProfile() {
    try {
        return sanitizeProfile(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"));
    } catch (error) {
        console.warn("Unable to read Hill Cruze profile, resetting it.", error);
        return deepClone(DEFAULT_PROFILE);
    }
}

export function saveProfile(profile) {
    const sanitized = sanitizeProfile(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    return sanitized;
}

export function getNextUnlock(profile = getProfile()) {
    return UNLOCKS.find(({ kind, id }) => !profile[PROFILE_KEYS[kind]].includes(id)) || null;
}

export function updateSelection(kind, id) {
    const profile = getProfile();
    const unlockedKey = PROFILE_KEYS[kind];
    const selectedKey = SELECTED_KEYS[kind];

    if (profile[unlockedKey].includes(id)) {
        profile[selectedKey] = id;
        return saveProfile(profile);
    }

    return profile;
}

export function applyRunResults({ score, distance, coins }) {
    const profile = getProfile();
    profile.bestScore = Math.max(profile.bestScore, Math.floor(score));
    profile.longestDistance = Math.max(profile.longestDistance, Math.floor(distance));
    profile.totalCoins += Math.max(0, Math.floor(coins));

    const unlockedThisRun = [];

    for (const unlock of UNLOCKS) {
        const unlockedKey = PROFILE_KEYS[unlock.kind];
        if (profile.totalCoins >= unlock.cost && !profile[unlockedKey].includes(unlock.id)) {
            profile[unlockedKey].push(unlock.id);
            unlockedThisRun.push({
                ...unlock,
                label: getCatalogItem(unlock.kind, unlock.id).label
            });
        }
    }

    return {
        profile: saveProfile(profile),
        unlockedThisRun,
        nextUnlock: getNextUnlock(profile)
    };
}
