import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// CONFIGURAÇÃO (Usa as credenciais do teu index.html)
const firebaseConfig = {
  apiKey: "AIzaSyD8E4ENQtP0xu_qZHe8G5TjqGPsrybkLOg",
  authDomain: "vivaleve258.firebaseapp.com",
  projectId: "vivaleve258",
  storageBucket: "vivaleve258.firebasestorage.app",
  messagingSenderId: "39491335561",
  appId: "1:39491335561:web:43c0980cf3720ebaf49d58",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const msgEl = document.getElementById("auth-message");

// --- Alternar Abas ---
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".auth-form")
      .forEach((f) => f.classList.remove("active"));

    btn.classList.add("active");
    document
      .getElementById(`${btn.dataset.target}-form`)
      .classList.add("active");
    msgEl.innerText = "";
  });
});

// --- Criar Conta ---
document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value;
    const username = document.getElementById("reg-username").value;
    const email = document.getElementById("reg-email").value;
    const country = document.getElementById("reg-country").value;
    const password = document.getElementById("reg-password").value;

    // Normalizar username
    const normalizedUsername = username.startsWith("@")
      ? username
      : `@${username}`;

    try {
      // 1. Verificar se o username já existe no Firestore
      const q = query(
        collection(db, "users"),
        where("username", "==", normalizedUsername),
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        throw { code: "custom/username-taken" };
      }

      // 2. Criar utilizador no Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // 3. Gravar dados adicionais
      await setDoc(doc(db, "users", user.uid), {
        fullName: name,
        username: normalizedUsername,
        email: email,
        country: country,
        createdAt: serverTimestamp(),
        role: "user",
      });

      window.location.href = "../../index.html";
    } catch (error) {
      handleAuthError(error);
    }
  });

// --- Login Normal ---
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "../../index.html";
  } catch (error) {
    handleAuthError(error);
  }
});

// --- Login com Google ---
document
  .getElementById("google-auth-btn")
  .addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Opcional: Criar perfil no Firestore se for novo utilizador
      await setDoc(
        doc(db, "users", user.uid),
        {
          fullName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          lastLogin: serverTimestamp(),
        },
        { merge: true },
      );

      window.location.href = "../../index.html";
    } catch (error) {
      handleAuthError(error);
    }
  });

// --- Tratamento de Erros ---
function handleAuthError(error) {
  console.error(error);
  let message = "Ocorreu um erro inesperado.";

  switch (error.code) {
    case "custom/username-taken":
      message = "Este nome de utilizador já está a ser usado.";
      break;
    case "auth/email-already-in-use":
      message = "Este e-mail já está em uso.";
      break;
    case "auth/invalid-email":
      message = "O e-mail inserido é inválido.";
      break;
    case "auth/weak-password":
      message = "A palavra-passe deve ter pelo menos 6 caracteres.";
      break;
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      message = "E-mail ou palavra-passe incorretos.";
      break;
    case "auth/popup-closed-by-user":
      message = "Login com Google cancelado.";
      break;
  }

  msgEl.innerText = message;
  msgEl.style.color = "var(--error)";
}
