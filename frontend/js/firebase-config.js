import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyD8E4ENQtP0xu_qZHe8G5TjqGPsrybkLOg",
  authDomain: "vivaleve258.firebaseapp.com",
  projectId: "vivaleve258",
  storageBucket: "vivaleve258.firebasestorage.app",
  messagingSenderId: "39491335561",
  appId: "1:39491335561:web:43c0980cf3720ebaf49d58",
  measurementId: "G-X7T8582S06",
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços inicializados
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
