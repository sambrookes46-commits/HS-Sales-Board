// =======================================
//  FIREBASE IMPORTS + SETUP
// =======================================

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import { app } from "./firebase-init.js";
const db = getFirestore(app);

// =======================================
//  ELEMENTS
// =======================================

const submitBtn = document.getElementById("submit-btn");
const agentInput = document.getElementById("agent");
const upfrontInput = document.getElementById("upfront");
const monitoringInput = document.getElementById("monitoring");
const notesInput = document.getElementById("notes");
const message = document.getElementById("message");

// =======================================
//  SUBMIT SALE
// =======================================

submitBtn.addEventListener("click", async () => {
    const agent = agentInput.value.trim();
    const upfront = Number(upfrontInput.value);
    const monitoring = Number(monitoringInput.value);
    const notes = notesInput.value.trim();

    if (!agent || isNaN(upfront) || isNaN(monitoring)) {
        message.style.color = "red";
        message.textContent = "Please fill all fields correctly.";
        return;
    }

    try {
        await addDoc(collection(db, "sales"), {
            agent,
            upfront,
            monitoring,
            notes,
            timestamp: serverTimestamp()
        });

        message.style.color = "green";
        message.textContent = "Sale submitted!";

        upfrontInput.value = "";
        monitoringInput.value = "";
        notesInput.value = "";

    } catch (err) {
        console.error("Error submitting sale:", err);
        message.style.color = "red";
        message.textContent = "Error submitting sale.";
    }
});

console.log("Sales form loaded.");
