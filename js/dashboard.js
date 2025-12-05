// =======================================
//  FIREBASE IMPORTS + SETUP
// =======================================

import {
    getFirestore,
    collection,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import { app } from "./firebase-init.js";
const db = getFirestore(app);

// =======================================
//  TIMEZONE / DATE HELPERS
// =======================================

const TZ = "Europe/Dublin";

function toDate(ts) {
    return new Date(ts.seconds * 1000);
}

function isToday(tsDate) {
    const today = new Date().toLocaleDateString("en-IE", { timeZone: TZ });
    const d = tsDate.toLocaleDateString("en-IE", { timeZone: TZ });
    return d === today;
}

function isThisWeek(tsDate) {
    const now = new Date();

    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);

    return tsDate >= monday && tsDate < nextMonday;
}

function isThisMonth(tsDate) {
    const now = new Date();
    return (
        tsDate.getMonth() === now.getMonth() &&
        tsDate.getFullYear() === now.getFullYear()
    );
}

function isThisYear(tsDate) {
    const now = new Date();
    return tsDate.getFullYear() === now.getFullYear();
}

// =======================================
//  AGENT LIST + STATS STRUCTURE
// =======================================

const agents = [
    "Bradley", "Craig", "Jamie", "John", "Johnny",
    "Keith", "Lar", "Ross", "Shane"
];

let agentStats = {};

function resetStats() {
    agents.forEach(a => {
        agentStats[a] = {
            daily: 0,
            weekly: 0,
            monthly: 0,
            yearly: 0,
            upfrontSum: 0,
            monitoringSum: 0,
            saleCount: 0,
            avgUpfront: 0,
            avgMonitoring: 0
        };
    });
}

resetStats();

// =======================================
//  REALTIME FIRESTORE LISTENER
// =======================================

const salesQuery = query(
    collection(db, "sales"),
    orderBy("timestamp", "desc")
);

onSnapshot(salesQuery, (snapshot) => {
    resetStats();

    let sales = [];
    let monthlyTotal = 0;
    let yearlyTotal = 0;

    snapshot.forEach(doc => {
        let data = doc.data();
        let agent = data.agent;

        if (!agents.includes(agent)) return;
        if (!data.timestamp) return;

        let ts = toDate(data.timestamp);

        if (isToday(ts)) agentStats[agent].daily++;
        if (isThisWeek(ts)) agentStats[agent].weekly++;
        if (isThisMonth(ts)) {
            agentStats[agent].monthly++;
            monthlyTotal++;
        }
        if (isThisYear(ts)) {
            agentStats[agent].yearly++;
            yearlyTotal++;
        }

        agentStats[agent].upfrontSum += Number(data.upfront || 0);
        agentStats[agent].monitoringSum += Number(data.monitoring || 0);
        agentStats[agent].saleCount++;
    });

    agents.forEach(a => {
        let s = agentStats[a];

        if (s.saleCount > 0) {
            s.avgUpfront = s.upfrontSum / s.saleCount;
            s.avgMonitoring = s.monitoringSum / s.saleCount;
        }
    });

    document.getElementById("kpi-monthly-value").textContent = monthlyTotal;
    document.getElementById("kpi-yearly-value").textContent = yearlyTotal;

    let teamUpfrontTotal = 0;
    let teamMonitoringTotal = 0;
    let count = 0;

    agents.forEach(a => {
        let s = agentStats[a];

        if (s.saleCount > 0) {
            teamUpfrontTotal += s.avgUpfront;
            teamMonitoringTotal += s.avgMonitoring;
            count++;
        }
    });

    let avgUpfront = count ? teamUpfrontTotal / count : 0;
    let avgMonitoring = count ? teamMonitoringTotal / count : 0;

    document.getElementById("kpi-upfront-value").textContent =
        "€" + avgUpfront.toFixed(2);

    document.getElementById("kpi-monitoring-value").textContent =
        "€" + avgMonitoring.toFixed(2);

    renderLeaderboard();
});

// =======================================
//  LEADERBOARD RENDERING
// =======================================

function renderLeaderboard() {
    const tbody = document.getElementById("leaderboard-body");
    tbody.innerHTML = "";

    let rows = agents.map(agent => {
        const s = agentStats[agent];
        return {
            agent,
            daily: s.daily,
            weekly: s.weekly,
            monthly: s.monthly,
            avgUpfront: s.avgUpfront,
            avgMonitoring: s.avgMonitoring,
            yearly: s.yearly
        };
    });

    rows.sort((a, b) => b.monthly - a.monthly);

    rows.forEach((row, index) => {
        row.rank = index + 1;
    });

    rows.forEach(row => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${row.agent}</td>
            <td>${row.daily}</td>
            <td>${row.weekly}</td>
            <td>${row.monthly}</td>
            <td>€${row.avgUpfront.toFixed(2)}</td>
            <td>€${row.avgMonitoring.toFixed(2)}</td>
            <td>${row.yearly}</td>
            <td class="rank-cell">${row.rank}</td>
        `;

        tbody.appendChild(tr);
    });
}

// =======================================
//  CLOCK (TOP RIGHT)
// =======================================

function updateClock() {
    const now = new Date().toLocaleString("en-IE", {
        timeZone: "Europe/Dublin",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    document.getElementById("clock").textContent = now;
}

setInterval(updateClock, 1000);
updateClock();

// =======================================
//  EXPORT FOR ADMIN PANEL REFRESH
// =======================================

export function refreshDashboard() {
    renderLeaderboard();
    updateClock();
}

console.log("Dashboard loaded — slim version with KPIs but no charts.");
