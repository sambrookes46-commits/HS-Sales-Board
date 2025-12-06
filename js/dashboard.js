// UPGRADED DASHBOARD.JS WITH KPI ANIMATION + ROW ANIMATION + TOP AGENT HIGHLIGHT

import {
    getFirestore,
    collection,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import { app } from "./firebase-init.js";
const db = getFirestore(app);

// ===============================
// KPI ANIMATION FUNCTION
// ===============================
function animateValue(element, start, end, duration = 600) {
    if (!element) return;

    const range = end - start;
    const startTime = performance.now();

    function updateAnimation(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const value = start + range * progress;

        if (element.dataset.type === "money") {
            element.textContent = "€" + value.toFixed(2);
        } else {
            element.textContent = Math.round(value);
        }

        if (progress < 1) requestAnimationFrame(updateAnimation);
    }

    requestAnimationFrame(updateAnimation);

    // Pulse animation
    element.classList.add("updated");
    setTimeout(() => element.classList.remove("updated"), 250);
}

// ===============================
// REAL-TIME FIRESTORE LISTENER
// ===============================
const salesRef = collection(db, "sales");
const salesQuery = query(salesRef, orderBy("timestamp", "desc"));

onSnapshot(salesQuery, (snapshot) => {
    const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateDashboard(sales);
});

// ===============================
// UPDATE DASHBOARD DISPLAY
// ===============================
function updateDashboard(sales) {

    const now = new Date();
    const today = now.toDateString();
    const currentWeek = getWeekNumber(now);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const agentStats = {};

    const agents = [
        "Bradley", "Craig", "Jamie", "John",
        "Johnny", "Keith", "Lar", "Ross", "Shane"
    ];

    agents.forEach(agent => {
        agentStats[agent] = {
            daily: 0,
            weekly: 0,
            monthly: 0,
            yearly: 0,
            upfrontTotal: 0,
            monitoringTotal: 0,
            saleCount: 0
        };
    });

    sales.forEach(sale => {
        if (!sale.timestamp) return;

        const t = sale.timestamp.toDate();
        const agent = sale.agent;
        if (!agentStats[agent]) return;

        const saleWeek = getWeekNumber(t);
        const saleMonth = t.getMonth();
        const saleYear = t.getFullYear();
        const saleDate = t.toDateString();

        agentStats[agent].saleCount++;
        agentStats[agent].upfrontTotal += sale.upfront || 0;
        agentStats[agent].monitoringTotal += sale.monitoring || 0;

        if (saleDate === today) agentStats[agent].daily++;
        if (saleWeek === currentWeek && saleYear === currentYear) agentStats[agent].weekly++;
        if (saleMonth === currentMonth && saleYear === currentYear) agentStats[agent].monthly++;
        if (saleYear === currentYear) agentStats[agent].yearly++;
    });

    const leaderboard = agents.map(agent => {
        const stats = agentStats[agent];
        return {
            agent,
            ...stats,
            avgUpfront: stats.saleCount ? stats.upfrontTotal / stats.saleCount : 0,
            avgMonitoring: stats.saleCount ? stats.monitoringTotal / stats.saleCount : 0,
            rankScore: stats.monthly
        };
    });

    leaderboard.sort((a, b) => b.rankScore - a.rankScore);
    renderLeaderboard(leaderboard);

    const monthlyTotal = leaderboard.reduce((sum, a) => sum + a.monthly, 0);
    const yearlyTotal = leaderboard.reduce((sum, a) => sum + a.yearly, 0);
    const avgUpfront =
        leaderboard.reduce((s, a) => s + a.upfrontTotal, 0) /
        leaderboard.reduce((s, a) => s + a.saleCount, 0) || 0;
    const avgMonitoring =
        leaderboard.reduce((s, a) => s + a.monitoringTotal, 0) /
        leaderboard.reduce((s, a) => s + a.saleCount, 0) || 0;

    animateValue(
        document.getElementById("kpi-monthly-value"),
        Number(document.getElementById("kpi-monthly-value").textContent) || 0,
        monthlyTotal
    );

    animateValue(
        document.getElementById("kpi-yearly-value"),
        Number(document.getElementById("kpi-yearly-value").textContent) || 0,
        yearlyTotal
    );

    animateValue(
        document.getElementById("kpi-upfront-value"),
        parseFloat(document.getElementById("kpi-upfront-value").textContent.replace("€", "")) || 0,
        avgUpfront
    );

    animateValue(
        document.getElementById("kpi-monitoring-value"),
        parseFloat(document.getElementById("kpi-monitoring-value").textContent.replace("€", "")) || 0,
        avgMonitoring
    );
}

// ===============================
// RENDER LEADERBOARD (with animation)
// ===============================
function renderLeaderboard(list) {
    const tbody = document.getElementById("leaderboard-body");
    tbody.innerHTML = "";

    list.forEach((entry, index) => {
        const row = document.createElement("tr");
        row.classList.add("table-row-animate");

        if (index === 0) row.classList.add("top-agent-row");

        row.innerHTML = `
            <td>${entry.agent}</td>
            <td>${entry.daily}</td>
            <td>${entry.weekly}</td>
            <td>${entry.monthly}</td>
            <td>€${entry.avgUpfront.toFixed(2)}</td>
            <td>€${entry.avgMonitoring.toFixed(2)}</td>
            <td>${entry.yearly}</td>
            <td>${index + 1}</td>
        `;

        tbody.appendChild(row);
    });
}

// ===============================
// WEEK NUMBER HELPER
// ===============================
function getWeekNumber(date) {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff =
        (date - start) / 86400000 +
        start.getDay() +
        1;
    return Math.floor(diff / 7);
}

console.log("Upgraded dashboard.js loaded.");
