// =======================================
//  FIREBASE INITIALIZATION
// =======================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyDOMfHc7LAXfddxDB6k8rOFMRO5ViMjuq0",
    authDomain: "home-sales-board.firebaseapp.com",
    projectId: "home-sales-board",
    storageBucket: "home-sales-board.firebasestorage.app",
    messagingSenderId: "743161573262",
    appId: "1:743161573262:web:f46f78a533e9c0047e7edf"
};

export const app = initializeApp(firebaseConfig);

console.log("Firebase initialised.");
