// =======================================
//  FIREBASE IMPORTS + SETUP
// =======================================

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import { refreshDashboard } from "./dashboard.js";
import { app } from "./firebase-init.js";

const db = getFirestore(app);

// =======================================
//  ELEMENTS
// =======================================

const adminBtn = document.getElementById("admin-btn");
const adminModal = document.getElementById("admin-modal");
const closeAdminBtn = document.getElementById("close-admin");
const adminPasswordInput = document.getElementById("admin-password");
const adminLoginBtn = document.getElementById("admin-login-btn");
const adminErrorText = document.getElementById("admin-error");

const editModal = document.getElementById("edit-modal");
const closeEditBtn = document.getElementById("close-edit");

const editAgent = document.getElementById("edit-agent");
const editUpfront = document.getElementById("edit-upfront");
const editMonitoring = document.getElementById("edit-monitoring");
const editNotes = document.getElementById("edit-notes");

const saveEditBtn = document.getElementById("save-edit-btn");
const deleteSaleBtn = document.getElementById("delete-sale-btn");

let selectedSaleId = null;

// =======================================
//  ADMIN LOGIN
// =======================================

adminBtn.addEventListener("click", () => {
    adminModal.classList.remove("hidden");
    adminPasswordInput.value = "";
    adminErrorText.textContent = "";
});

closeAdminBtn.addEventListener("click", () => {
    adminModal.classList.add("hidden");
});

adminLoginBtn.addEventListener("click", () => {
    const password = adminPasswordInput.value.trim();

    const correctPassword = "HomeSecure2025";

    if (password === correctPassword) {
        adminModal.classList.add("hidden");
        enableAdminClicks();
    } else {
        adminErrorText.textContent = "Incorrect password.";
        adminErrorText.style.color = "red";
    }
});

// =======================================
//  ENABLE ROW CLICKING FOR EDITING
// =======================================

function enableAdminClicks() {
    const rows = document.querySelectorAll("#leaderboard-body tr");

    rows.forEach((row, index) => {
        row.style.cursor = "pointer";
        row.addEventListener("click", () => openEditForRow(index));
    });
}

// =======================================
//  LOAD SALE DATA FOR EDITING
// =======================================

async function openEditForRow(rowIndex) {
    const q = query(collection(db, "sales"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    let sales = [];
    snapshot.forEach(docItem => {
        sales.push({ id: docItem.id, ...docItem.data() });
    });

    if (!sales[rowIndex]) {
        console.error("No sale found for row:", rowIndex);
        return;
    }

    const sale = sales[rowIndex];
    selectedSaleId = sale.id;

    editAgent.value = sale.agent;
    editUpfront.value = sale.upfront;
    editMonitoring.value = sale.monitoring;
    editNotes.value = sale.notes || "";

    editModal.classList.remove("hidden");
}

// Close edit modal
closeEditBtn.addEventListener("click", () => {
    editModal.classList.add("hidden");
});

// =======================================
//  SAVE EDITED SALE
// =======================================

saveEditBtn.addEventListener("click", async () => {
    if (!selectedSaleId) return;

    const ref = doc(db, "sales", selectedSaleId);

    await updateDoc(ref, {
        agent: editAgent.value,
        upfront: Number(editUpfront.value),
        monitoring: Number(editMonitoring.value),
        notes: editNotes.value
    });

    editModal.classList.add("hidden");
    refreshDashboard();
});

// =======================================
//  DELETE SALE
// =======================================

deleteSaleBtn.addEventListener("click", async () => {
    if (!selectedSaleId) return;

    const ref = doc(db, "sales", selectedSaleId);
    await deleteDoc(ref);

    editModal.classList.add("hidden");
    refreshDashboard();
});

console.log("Admin panel loaded.");
