import {
    COSMETICS,
    PROFILE_KEYS,
    SELECTED_KEYS,
    UNLOCKS,
    formatInteger,
    getBiome,
    getCatalogItem
} from "./config.js";
import { getNextUnlock, getProfile, updateSelection } from "./storage.js";

function getUnlockCost(kind, id) {
    return UNLOCKS.find((unlock) => unlock.kind === kind && unlock.id === id)?.cost || null;
}

function createClimateCard(item, profile) {
    const kind = "backgroundPacks";
    const biome = getBiome(item.id);
    const button = document.createElement("button");
    const unlocked = profile[PROFILE_KEYS[kind]].includes(item.id);
    const selected = profile[SELECTED_KEYS[kind]] === item.id;
    const unlockCost = getUnlockCost(kind, item.id);

    button.type = "button";
    button.className = `loadout-option${selected ? " is-selected" : ""}${unlocked ? "" : " is-locked"} loadout-option--pack`;
    button.dataset.kind = kind;
    button.dataset.id = item.id;
    button.disabled = !unlocked;
    button.style.setProperty("--option-accent", biome.accent);
    button.style.backgroundImage =
        `linear-gradient(180deg, rgba(5, 11, 17, 0.2), rgba(5, 11, 17, 0.84)), url('${biome.asset}')`;
    button.innerHTML = `
        <span class="loadout-option__eyebrow">${unlocked ? "Climate ready" : `Unlock at ${formatInteger(unlockCost)}`}</span>
        <strong>${biome.label}</strong>
        <span class="loadout-option__meta">${biome.summary}</span>
    `;

    button.addEventListener("click", () => {
        updateSelection(kind, item.id);
        refreshDashboard();
    });

    return button;
}

function renderClimateOptions(container, profile) {
    container.innerHTML = "";
    COSMETICS.backgroundPacks.forEach((item) => {
        container.appendChild(createClimateCard(item, profile));
    });
}

function renderUnlockRoadmap(container, profile) {
    container.innerHTML = "";

    UNLOCKS.forEach((unlock) => {
        const unlocked = profile[PROFILE_KEYS[unlock.kind]].includes(unlock.id);
        const card = document.createElement("article");
        const label = getCatalogItem(unlock.kind, unlock.id).label;
        const distanceToUnlock = Math.max(0, unlock.cost - profile.totalCoins);
        card.className = `unlock-step${unlocked ? " is-unlocked" : ""}`;
        card.innerHTML = `
            <span class="unlock-step__kind">climate</span>
            <strong>${label}</strong>
            <span class="unlock-step__cost">${unlocked ? "Unlocked" : `${formatInteger(unlock.cost)} coins`}</span>
            <p>${unlocked ? "Ready in the garage." : `${formatInteger(distanceToUnlock)} coins to go.`}</p>
        `;
        container.appendChild(card);
    });
}

function refreshDashboard() {
    const profile = getProfile();
    const nextUnlock = getNextUnlock(profile);
    const selectedBiome = getBiome(profile.selectedBackgroundPack);

    document.getElementById("bestScore").textContent = formatInteger(profile.bestScore);
    document.getElementById("longestDistance").textContent = `${formatInteger(profile.longestDistance)} m`;
    document.getElementById("totalCoins").textContent = formatInteger(profile.totalCoins);
    document.getElementById("totalCoinsFocus").textContent = formatInteger(profile.totalCoins);
    document.getElementById("selectedBackgroundSummary").textContent = selectedBiome.label;

    document.getElementById("selectedRider").textContent = "Jump / Duck / Boost";
    document.getElementById("selectedBike").textContent = "Coins unlock climates";
    document.getElementById("selectedBadge").textContent = "Opening climate";
    document.getElementById("selectedBackgroundLabel").textContent = selectedBiome.label;
    document.getElementById("nextUnlock").textContent = nextUnlock
        ? `Next climate: ${getCatalogItem(nextUnlock.kind, nextUnlock.id).label}`
        : "All climates unlocked";

    document.getElementById("profileBackdrop").style.backgroundImage =
        `linear-gradient(180deg, rgba(5, 11, 17, 0.12), rgba(5, 11, 17, 0.88)), url('${selectedBiome.asset}')`;

    renderClimateOptions(document.getElementById("backgroundOptions"), profile);
    renderUnlockRoadmap(document.getElementById("unlockRoadmap"), profile);
}

document.addEventListener("DOMContentLoaded", () => {
    refreshDashboard();
    window.addEventListener("storage", refreshDashboard);
});
