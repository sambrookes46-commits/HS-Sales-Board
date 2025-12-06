
// UPGRADED DASHBOARD.JS — WEEK FIX + CORE/SWEEP SPLIT + TEAM RANKS + TEAM TOP HIGHLIGHT

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
// KPI ANIMATION
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

    element.classList.add("updated");
    setTimeout(() => element.classList.remove("updated"), 250);
}

// ===============================
// TRUE MONDAY–SUNDAY WEEK CHECK
// ===============================
function isSameWeek(date, now) {
    const nowDay = now.getDay(); 
    const monday = new Date(now);
    monday.setHours(0,0,0,0);

    const diffToMonday = (nowDay === 0 ? 6 : nowDay - 1);
    monday.setDate(now.getDate() - diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);

    return date >= monday && date <= sunday;
}

// ===============================
// FIRESTORE LISTENER
// ===============================
const salesRef = collection(db, "sales");
const qSales = query(salesRef, orderBy("timestamp", "desc"));

onSnapshot(qSales, (snapshot) => {
    const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateDashboard(sales);
});

// ===============================
// MAIN DASHBOARD UPDATE
// ===============================
function updateDashboard(sales) {

    const now = new Date();
    const todayStr = now.toDateString();
    const monthNow = now.getMonth();
    const yearNow = now.getFullYear();

    // TEAM GROUPS
    const CORE = ["Craig", "Jamie", "Johnny", "Lar", "Shane"];
    const SWEEP = ["Bradley", "John", "Keith", "Ross"];

    // INIT STATS
    const agentStats = {};
    [...CORE, ...SWEEP].forEach(agent => {
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

    // AGGREGATE SALES
    sales.forEach(sale => {
        if (!sale.timestamp) return;
        const t = sale.timestamp.toDate();
        const agent = sale.agent;
        if (!agentStats[agent]) return;

        const dateStr = t.toDateString();
        const saleMonth = t.getMonth();
        const saleYear = t.getFullYear();

        agentStats[agent].saleCount++;
        agentStats[agent].upfrontTotal += sale.upfront || 0;
        agentStats[agent].monitoringTotal += sale.monitoring || 0;

        if (dateStr === todayStr) agentStats[agent].daily++;
        if (isSameWeek(t, now)) agentStats[agent].weekly++;
        if (saleMonth === monthNow && saleYear === yearNow) agentStats[agent].monthly++;
        if (saleYear === yearNow) agentStats[agent].yearly++;
    });

    // CALCULATE LEADERBOARD DATA
    const allAgents = [...CORE, ...SWEEP].map(agent => {
        const s = agentStats[agent];
        return {
            agent,
            ...s,
            avgUpfront: s.saleCount ? s.upfrontTotal / s.saleCount : 0,
            avgMonitoring: s.saleCount ? s.monitoringTotal / s.saleCount : 0,
            rankScore: s.monthly
        };
    });

    // SPLIT TEAMS
    const coreList = allAgents.filter(a => CORE.includes(a.agent));
    const sweepList = allAgents.filter(a => SWEEP.includes(a.agent));

    // SORT TEAMS BY MONTHLY SALES
    coreList.sort((a, b) => b.rankScore - a.rankScore);
    sweepList.sort((a, b) => b.rankScore - a.rankScore);

    // RENDER BOTH TABLES
    renderTeam("core-team-body", coreList);
    renderTeam("sweep-team-body", sweepList);

    // KPIs (global)
    const monthlyTotal = allAgents.reduce((s, a) => s + a.monthly, 0);
    const yearlyTotal = allAgents.reduce((s, a) => s + a.yearly, 0);

    const totalUpfront = allAgents.reduce((s, a) => s + a.upfrontTotal, 0);
    const totalMonitoring = allAgents.reduce((s, a) => s + a.monitoringTotal, 0);
    const totalSales = allAgents.reduce((s, a) => s + a.saleCount, 0);

    const avgUpfront = totalSales ? totalUpfront / totalSales : 0;
    const avgMonitoring = totalSales ? totalMonitoring / totalSales : 0;

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
        parseFloat(document.getElementById("kpi-upfront-value").textContent.replace("€","")) || 0,
        avgUpfront
    );

    animateValue(
        document.getElementById("kpi-monitoring-value"),
        parseFloat(document.getElementById("kpi-monitoring-value").textContent.replace("€","")) || 0,
        avgMonitoring
    );
}

// ===============================
// RENDER TEAM TABLE
// ===============================
function renderTeam(tbodyId, list) {
    const tbody = document.getElementById(tbodyId);
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

console.log("Dashboard.js Loaded — CORE/SWEEP + Weekly Fix Active");
