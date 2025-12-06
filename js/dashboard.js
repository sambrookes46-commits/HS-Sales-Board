// ===============================
// FIREBASE IMPORTS
// ===============================
import { db } from "./firebase-init.js";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===============================
// TEAM DEFINITIONS
// ===============================
const CORE = ["Craig", "Jamie", "Johnny", "Lar", "Shane"];
const SWEEP = ["Bradley", "John", "Keith", "Ross"];

// ===============================
// DOM REFERENCES
// ===============================
const coreBody = document.getElementById("core-team-body");
const sweepBody = document.getElementById("sweep-team-body");

const kpiMonthly = document.getElementById("kpi-monthly-value");
const kpiUpfront = document.getElementById("kpi-upfront-value");
const kpiMonitoring = document.getElementById("kpi-monitoring-value");
const kpiYearly = document.getElementById("kpi-yearly-value");

// ===============================
// STATE FOR DETECTING NEW SALES
// ===============================
let previousSaleCount = 0;

// ===============================
// HELPER: Start of week (Monday)
// ===============================
function getStartOfWeek() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
}

// ===============================
// BADGE ENGINE
// ===============================
function computeBadges(agentStats) {
    const badges = [];

    // DAILY STREAK
    if (agentStats.daily >= 7) badges.push("⚡");
    else if (agentStats.daily >= 5) badges.push("🔥🔥");
    else if (agentStats.daily >= 3) badges.push("🔥");

    // WEEKLY BADGES (team-specific)
    if (agentStats.team === "CORE") {
        if (agentStats.weekly >= 20) badges.push("💣");
        else if (agentStats.weekly >= 15) badges.push("🚀");
    } else {
        if (agentStats.weekly >= 8) badges.push("💣");
        else if (agentStats.weekly >= 6) badges.push("🚀");
    }

    // TEAM LEADER
    if (agentStats.isLeader) badges.push("👑");

    // TOP REVENUE
    if (agentStats.isTopRevenue) badges.push("💎");

    return badges;
}

// ===============================
// CELEBRATION BANNER
// ===============================
function showCelebrationBanner(agent, upfront, monitoring) {
    const banner = document.createElement("div");
    banner.className = "celebration-banner";

    banner.innerHTML = `
        🎉 NEW SALE! ${agent} added 
        €${upfront.toFixed(2)} upfront /
        €${monitoring.toFixed(2)} monitoring
    `;

    document.body.appendChild(banner);
    setTimeout(() => banner.classList.add("fade-out"), 4800);
    setTimeout(() => banner.remove(), 5500);
}

// ===============================
// PROCESS SALES INTO TEAM STATS
// ===============================
function processSales(sales) {
    const today = new Date().toISOString().split("T")[0];
    const weekStart = getStartOfWeek();
    const month = new Date().getMonth();
    const year = new Date().getFullYear();

    // initialize agent stats
    const stats = {};

    [...CORE, ...SWEEP].forEach((agent) => {
        stats[agent] = {
            agent,
            team: CORE.includes(agent) ? "CORE" : "SWEEP",
            daily: 0,
            weekly: 0,
            monthly: 0,
            yearly: 0,
            upfrontTotal: 0,
            monitoringTotal: 0,
            saleCount: 0,
        };
    });

    // COUNTING
    sales.forEach((sale) => {
        const agent = sale.agent;
        if (!stats[agent]) return;

        const date = sale.date;
        const saleDate = new Date(date);

        stats[agent].saleCount++;
        stats[agent].upfrontTotal += Number(sale.upfront);
        stats[agent].monitoringTotal += Number(sale.monitoring);

        if (date === today) stats[agent].daily++;
        if (saleDate >= weekStart) stats[agent].weekly++;
        if (saleDate.getMonth() === month) stats[agent].monthly++;
        if (saleDate.getFullYear() === year) stats[agent].yearly++;
    });

    // averages
    Object.values(stats).forEach((s) => {
        s.avgUpfront = s.saleCount > 0 ? s.upfrontTotal / s.saleCount : 0;
        s.avgMonitoring = s.saleCount > 0 ? s.monitoringTotal / s.saleCount : 0;
    });

    return Object.values(stats);
}

// ===============================
// COMPUTE TOP REVENUE BADGE
// ===============================
function computeTopRevenue(stats, teamList) {
    const teamStats = stats.filter((s) => teamList.includes(s.agent));

    const upfrontSorted = [...teamStats].sort((a, b) => b.avgUpfront - a.avgUpfront);
    const monitoringSorted = [...teamStats].sort((a, b) => b.avgMonitoring - a.avgMonitoring);

    const scores = {};

    teamStats.forEach((agent) => {
        const upRank = upfrontSorted.findIndex((x) => x.agent === agent.agent) + 1;
        const monRank = monitoringSorted.findIndex((x) => x.agent === agent.agent) + 1;
        scores[agent.agent] = upRank + monRank;
    });

    const lowestScore = Math.min(...Object.values(scores));

    return Object.keys(scores).find((a) => scores[a] === lowestScore);
}

// ===============================
// RENDER TABLES
// ===============================
function renderTables(stats) {
    const core = stats.filter((s) => s.team === "CORE");
    const sweep = stats.filter((s) => s.team === "SWEEP");

    // TEAM LEADER (rank 1 yearly)
    core.sort((a, b) => b.yearly - a.yearly);
    sweep.sort((a, b) => b.yearly - a.yearly);

    if (core.length > 0) core[0].isLeader = true;
    if (sweep.length > 0) sweep[0].isLeader = true;

    // TOP REVENUE
    const coreTop = computeTopRevenue(stats, CORE);
    const sweepTop = computeTopRevenue(stats, SWEEP);

    stats.forEach((s) => {
        if (s.agent === coreTop || s.agent === sweepTop) {
            s.isTopRevenue = true;
        }
    });

    // Now re-sort for table view (rank by monthly)
    core.sort((a, b) => b.monthly - a.monthly);
    sweep.sort((a, b) => b.monthly - a.monthly);

    // Clear tables
    coreBody.innerHTML = "";
    sweepBody.innerHTML = "";

    // Render rows
    function renderRow(agentStats, index) {
        const row = document.createElement("tr");

        const badges = computeBadges(agentStats);
        const badgeHTML = badges.map((b) => `<span>${b}</span>`).join("");

        row.innerHTML = `
            <td>${agentStats.agent}</td>
            <td class="badge-cell">${badgeHTML}</td>
            <td>${agentStats.daily}</td>
            <td>${agentStats.weekly}</td>
            <td>${agentStats.monthly}</td>
            <td>€${agentStats.avgUpfront.toFixed(2)}</td>
            <td>€${agentStats.avgMonitoring.toFixed(2)}</td>
            <td>${agentStats.yearly}</td>
            <td>${index + 1}</td>
        `;

        return row;
    }

    core.forEach((s, i) => coreBody.appendChild(renderRow(s, i)));
    sweep.forEach((s, i) => sweepBody.appendChild(renderRow(s, i)));
}

// ===============================
// KPI UPDATE
// ===============================
function updateKPIs(stats) {
    const monthlyTotal = stats.reduce((sum, a) => sum + a.monthly, 0);
    const avgUpfront =
        stats.reduce((sum, a) => sum + a.avgUpfront, 0) / stats.length;
    const avgMonitoring =
        stats.reduce((sum, a) => sum + a.avgMonitoring, 0) / stats.length;
    const yearlyTotal = stats.reduce((sum, a) => sum + a.yearly, 0);

    kpiMonthly.textContent = monthlyTotal;
    kpiUpfront.textContent = `€${avgUpfront.toFixed(2)}`;
    kpiMonitoring.textContent = `€${avgMonitoring.toFixed(2)}`;
    kpiYearly.textContent = yearlyTotal;
}

// ===============================
// FIRESTORE LISTENER
// ===============================
const salesRef = collection(db, "sales");
const q = query(salesRef, orderBy("timestamp", "asc"));

onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map((doc) => doc.data());

    // Detect NEW sale
    if (sales.length > previousSaleCount && previousSaleCount !== 0) {
        const newestSale = sales[sales.length - 1];
        showCelebrationBanner(newestSale.agent, Number(newestSale.upfront), Number(newestSale.monitoring));
    }

    previousSaleCount = sales.length;

    const stats = processSales(sales);

    renderTables(stats);
    updateKPIs(stats);
});
