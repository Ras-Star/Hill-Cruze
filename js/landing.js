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

function populateSelect(selectElement, kind, profile) {
    const unlocked = profile[PROFILE_KEYS[kind]];
    const selected = profile[SELECTED_KEYS[kind]];
    selectElement.innerHTML = "";

    COSMETICS[kind].forEach((item) => {
        const option = document.createElement("option");
        const unlockedItem = unlocked.includes(item.id);
        option.value = item.id;
        option.textContent = unlockedItem ? item.label : `${item.label} (locked)`;
        option.disabled = !unlockedItem;
        option.selected = item.id === selected;
        selectElement.appendChild(option);
    });
}

function renderUnlockRoadmap(container, profile) {
    container.innerHTML = "";

    UNLOCKS.forEach((unlock) => {
        const unlocked = profile[PROFILE_KEYS[unlock.kind]].includes(unlock.id);
        const card = document.createElement("article");
        card.className = `unlock-card ${unlocked ? "is-unlocked" : "is-locked"}`;
        card.innerHTML = `
            <p class="eyebrow">${unlock.kind.replace("backgroundPacks", "background packs")}</p>
            <h3 class="mt-2 mb-2">${getCatalogItem(unlock.kind, unlock.id).label}</h3>
            <p class="mb-3">${unlocked ? "Unlocked and ready to equip." : "Keep collecting run tokens to claim it."}</p>
            <span class="unlock-card__cost"><i class="bi bi-coin"></i>${formatInteger(unlock.cost)}</span>
        `;
        container.appendChild(card);
    });
}

function renderTerrainGallery(container, profile) {
    container.innerHTML = "";

    BIOMES.forEach((biome) => {
        const unlocked = profile.unlockedBackgroundPacks.includes(biome.id);
        const card = document.createElement("article");
        card.className = "terrain-card";
        card.innerHTML = `
            <div class="terrain-card__image" style="background-image: linear-gradient(180deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.5)), url('${biome.asset}')"></div>
            <div class="terrain-card__body">
                <div class="d-flex justify-content-between align-items-center gap-3">
                    <h3>${biome.label}</h3>
                    <span class="preview-chip">${unlocked ? "Unlocked" : "Locked"}</span>
                </div>
                <p class="mb-0 mt-2">${biome.summary}</p>
            </div>
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
    document.getElementById("selectedRider").textContent = getCatalogItem("riders", profile.selectedRider).label;
    document.getElementById("selectedBike").textContent = getCatalogItem("bikes", profile.selectedBike).label;
    document.getElementById("selectedBadge").textContent = getCatalogItem("badges", profile.selectedBadge).label;
    document.getElementById("selectedBackgroundLabel").textContent = selectedBiome.label;
    document.getElementById("nextUnlock").textContent = nextUnlock
        ? `Next unlock: ${getCatalogItem(nextUnlock.kind, nextUnlock.id).label}`
        : "Everything unlocked";
    document.getElementById("profileBackdrop").style.backgroundImage =
        `linear-gradient(180deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.55)), url('${selectedBiome.asset}')`;

    populateSelect(document.getElementById("riderSelect"), "riders", profile);
    populateSelect(document.getElementById("bikeSelect"), "bikes", profile);
    populateSelect(document.getElementById("badgeSelect"), "badges", profile);
    populateSelect(document.getElementById("backgroundSelect"), "backgroundPacks", profile);

    renderUnlockRoadmap(document.getElementById("unlockRoadmap"), profile);
    renderTerrainGallery(document.getElementById("terrainGallery"), profile);
}

document.addEventListener("DOMContentLoaded", () => {
    const bindings = [
        ["riderSelect", "riders"],
        ["bikeSelect", "bikes"],
        ["badgeSelect", "badges"],
        ["backgroundSelect", "backgroundPacks"]
    ];

    bindings.forEach(([elementId, kind]) => {
        document.getElementById(elementId).addEventListener("change", (event) => {
            updateSelection(kind, event.target.value);
            refreshDashboard();
        });
    });

    refreshDashboard();
});
