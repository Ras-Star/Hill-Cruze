import {
    BIOMES,
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

function getOptionAccent(kind, item) {
    if (kind === "riders") return `#${item.accent.toString(16).padStart(6, "0")}`;
    if (kind === "bikes") return `#${item.frame.toString(16).padStart(6, "0")}`;
    if (kind === "backgroundPacks") return getBiome(item.id).accent;
    return "#ffd670";
}

function createOptionCard(kind, item, profile) {
    const button = document.createElement("button");
    const unlocked = profile[PROFILE_KEYS[kind]].includes(item.id);
    const selected = profile[SELECTED_KEYS[kind]] === item.id;
    const accent = getOptionAccent(kind, item);
    const unlockCost = getUnlockCost(kind, item.id);

    button.type = "button";
    button.className = `loadout-option${selected ? " is-selected" : ""}${unlocked ? "" : " is-locked"}${kind === "backgroundPacks" ? " loadout-option--pack" : ""}`;
    button.dataset.kind = kind;
    button.dataset.id = item.id;
    button.disabled = !unlocked;
    button.style.setProperty("--option-accent", accent);

    if (kind === "backgroundPacks") {
        const biome = getBiome(item.id);
        button.style.backgroundImage =
            `linear-gradient(180deg, rgba(5, 11, 17, 0.2), rgba(5, 11, 17, 0.84)), url('${biome.asset}')`;
        button.innerHTML = `
            <span class="loadout-option__eyebrow">${unlocked ? "Pack ready" : `Unlock at ${formatInteger(unlockCost)}`}</span>
            <strong>${biome.label}</strong>
            <span class="loadout-option__meta">${biome.summary}</span>
        `;
        return button;
    }

    let meta = "Unlocked";
    if (kind === "riders") meta = unlocked ? "Rider profile ready" : `Unlock at ${formatInteger(unlockCost)}`;
    if (kind === "bikes") meta = unlocked ? "Bike profile ready" : `Unlock at ${formatInteger(unlockCost)}`;
    if (kind === "badges") meta = unlocked ? "Badge active" : `Unlock at ${formatInteger(unlockCost)}`;

    button.innerHTML = `
        <span class="loadout-option__swatch"></span>
        <strong>${item.label}</strong>
        <span class="loadout-option__meta">${meta}</span>
    `;

    return button;
}

function renderLoadoutGroup(container, kind, profile) {
    container.innerHTML = "";

    COSMETICS[kind].forEach((item) => {
        const card = createOptionCard(kind, item, profile);
        card.addEventListener("click", () => {
            updateSelection(kind, item.id);
            refreshDashboard();
        });
        container.appendChild(card);
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
            <span class="unlock-step__kind">${unlock.kind.replace("backgroundPacks", "pack")}</span>
            <strong>${label}</strong>
            <span class="unlock-step__cost">${unlocked ? "Unlocked" : `${formatInteger(unlock.cost)} tokens`}</span>
            <p>${unlocked ? "Ready in the garage." : `${formatInteger(distanceToUnlock)} tokens to go.`}</p>
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

    document.getElementById("selectedRider").textContent = getCatalogItem("riders", profile.selectedRider).label;
    document.getElementById("selectedBike").textContent = getCatalogItem("bikes", profile.selectedBike).label;
    document.getElementById("selectedBadge").textContent = getCatalogItem("badges", profile.selectedBadge).label;
    document.getElementById("selectedBackgroundLabel").textContent = selectedBiome.label;
    document.getElementById("nextUnlock").textContent = nextUnlock
        ? `Next reward: ${getCatalogItem(nextUnlock.kind, nextUnlock.id).label}`
        : "All rewards unlocked";

    document.getElementById("profileBackdrop").style.backgroundImage =
        `linear-gradient(180deg, rgba(5, 11, 17, 0.12), rgba(5, 11, 17, 0.88)), url('${selectedBiome.asset}')`;

    renderLoadoutGroup(document.getElementById("riderOptions"), "riders", profile);
    renderLoadoutGroup(document.getElementById("bikeOptions"), "bikes", profile);
    renderLoadoutGroup(document.getElementById("badgeOptions"), "badges", profile);
    renderLoadoutGroup(document.getElementById("backgroundOptions"), "backgroundPacks", profile);
    renderUnlockRoadmap(document.getElementById("unlockRoadmap"), profile);
}

document.addEventListener("DOMContentLoaded", () => {
    refreshDashboard();
    window.addEventListener("storage", refreshDashboard);
});
