import {
    BIOMES,
    COSMETICS,
    PROFILE_KEYS,
    UNLOCKS,
    formatInteger,
    getCatalogItem
} from "./config.js";
import { getNextUnlock, getProfile, getUnlockProgress, updateSelection } from "./storage.js";

function colorNumberToCss(value) {
    return `#${value.toString(16).padStart(6, "0")}`;
}

function getProfileBiome(profile) {
    const index = Math.floor((profile.totalDistance / 2200) + (profile.totalRuns / 3)) % BIOMES.length;
    return BIOMES[index] || BIOMES[0];
}

function applyBiomeSurface(element, biome) {
    if (!element) return;
    element.style.setProperty("--option-accent", biome.accent);
    element.style.backgroundImage = [
        `radial-gradient(circle at 20% 18%, ${biome.accent}55, transparent 34%)`,
        `radial-gradient(circle at 80% 64%, ${colorNumberToCss(biome.glow)}30, transparent 30%)`,
        "linear-gradient(180deg, rgba(5, 11, 17, 0.1), rgba(5, 11, 17, 0.86))",
        `linear-gradient(145deg, ${colorNumberToCss(biome.skyTop)}, ${colorNumberToCss(biome.skyMid)} 48%, ${colorNumberToCss(biome.ridgeTint)})`
    ].join(", ");
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function renderBadges(container, profile) {
    if (!container) return;
    container.innerHTML = "";

    COSMETICS.badges.forEach((badge, index) => {
        const unlocked = profile[PROFILE_KEYS.badges].includes(badge.id);
        const selected = profile.selectedBadge === badge.id;
        const matchingUnlock = UNLOCKS.find((unlock) => unlock.kind === "badges" && unlock.id === badge.id);
        const scoreGoal = Number(matchingUnlock?.score) || 0;
        const distanceGoal = Number(matchingUnlock?.distance) || 0;
        const scoreRatio = scoreGoal ? Math.min(1, profile.totalScore / scoreGoal) : 1;
        const distanceRatio = distanceGoal ? Math.min(1, profile.totalDistance / distanceGoal) : 1;
        const completion = unlocked ? 100 : Math.round(Math.min(scoreRatio, distanceRatio) * 100);
        const button = document.createElement("button");
        button.type = "button";
        button.className = `badge-card${unlocked ? " is-unlocked" : " is-locked"}${selected ? " is-selected" : ""}`;
        button.disabled = !unlocked;
        button.innerHTML = `
            <div class="badge-card__crest" aria-hidden="true">${index + 1}</div>
            <span>${selected ? "Equipped" : unlocked ? "Unlocked" : `${completion}% complete`}</span>
            <strong>${badge.label}</strong>
            <small>${badge.summary}</small>
            <div class="badge-card__goals">
                <div class="badge-card__goal-row">
                    <span>Score</span>
                    <em>${matchingUnlock ? `${formatInteger(profile.totalScore)} / ${formatInteger(scoreGoal)}` : "Unlocked"}</em>
                </div>
                <div class="badge-card__bar"><i style="width: ${Math.round(scoreRatio * 100)}%"></i></div>
                <div class="badge-card__goal-row">
                    <span>Distance</span>
                    <em>${matchingUnlock ? `${formatInteger(profile.totalDistance)} m / ${formatInteger(distanceGoal)} m` : "Unlocked"}</em>
                </div>
                <div class="badge-card__bar badge-card__bar--distance"><i style="width: ${Math.round(distanceRatio * 100)}%"></i></div>
            </div>
        `;
        button.addEventListener("click", () => {
            updateSelection("badges", badge.id);
            refreshDashboard();
        });
        container.appendChild(button);
    });
}

function refreshDashboard() {
    const profile = getProfile();
    const nextUnlock = getNextUnlock(profile);
    const progress = getUnlockProgress(profile, nextUnlock);
    const activeBadge = getCatalogItem("badges", profile.selectedBadge);
    const badgeCount = profile.unlockedBadges.length;

    setText("bestScore", formatInteger(profile.bestScore));
    setText("longestDistance", `${formatInteger(profile.longestDistance)} m`);
    setText("totalScore", formatInteger(profile.totalScore));
    setText("totalDistance", `${formatInteger(profile.totalDistance)} m`);
    setText("totalRuns", formatInteger(profile.totalRuns));
    setText("totalCoins", formatInteger(profile.totalCoins));
    setText("totalBadges", formatInteger(badgeCount));
    setText("badgeCount", `${formatInteger(badgeCount)} unlocked`);
    setText("activeBadge", activeBadge.label);
    setText("nextBadge", nextUnlock ? getCatalogItem(nextUnlock.kind, nextUnlock.id).label : "All badges unlocked");
    setText("scoreProgressLabel", nextUnlock ? `${formatInteger(profile.totalScore)} / ${formatInteger(progress.scoreGoal)}` : "Complete");
    setText("distanceProgressLabel", nextUnlock ? `${formatInteger(profile.totalDistance)} m / ${formatInteger(progress.distanceGoal)} m` : "Complete");

    const scoreFill = document.getElementById("scoreProgressFill");
    const distanceFill = document.getElementById("distanceProgressFill");
    if (scoreFill) scoreFill.style.width = `${Math.round(progress.scoreRatio * 100)}%`;
    if (distanceFill) distanceFill.style.width = `${Math.round(progress.distanceRatio * 100)}%`;

    applyBiomeSurface(document.getElementById("profileBackdrop"), getProfileBiome(profile));
    renderBadges(document.getElementById("badgeGrid"), profile);
}

function bindTabs() {
    const tabs = [...document.querySelectorAll("[data-hub-tab]")];
    const views = [...document.querySelectorAll("[data-hub-view]")];

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.hubTab;
            tabs.forEach((button) => button.classList.toggle("is-active", button === tab));
            views.forEach((view) => view.classList.toggle("is-active", view.dataset.hubView === target));
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    bindTabs();
    refreshDashboard();
    window.addEventListener("storage", refreshDashboard);
});
