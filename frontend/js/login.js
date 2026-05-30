/**
 * Viva Leve - Auth Logic (Modular Firebase v10)
 */
import { auth, db, functions } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";
const googleProvider = new GoogleAuthProvider();

const msgEl = document.getElementById("auth-message");
let usernameTimer;
let confirmationResult = null;

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

// --- Alternar Métodos de Login (Email vs Phone) ---
document.querySelectorAll(".method-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".method-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".method-fields")
      .forEach((f) => f.classList.remove("active"));
    btn.classList.add("active");
    document
      .getElementById(`login-${btn.dataset.method}-fields`)
      .classList.add("active");
  });
});

// --- Configuração do reCAPTCHA ---
const initRecaptcha = () => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
      },
    );
  }
};

// Função auxiliar para migrar favoritos do LocalStorage para o Firestore
async function syncFavoritesToFirestore(userId) {
  const localFavs = JSON.parse(localStorage.getItem("vivaLeveFavorites")) || [];
  if (localFavs.length > 0) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { favorites: localFavs });
  }
}

// --- Funcionalidade Ver Senha ---
document.querySelectorAll(".toggle-password").forEach((icon) => {
  icon.addEventListener("click", () => {
    const input = icon.previousElementSibling;
    if (input.type === "password") {
      input.type = "text";
      icon.classList.replace("ph-eye", "ph-eye-slash");
      icon.style.color = "var(--gold)";
    } else {
      input.type = "password";
      icon.classList.replace("ph-eye-slash", "ph-eye");
      icon.style.color = "var(--text-dim)";
    }
  });
});

// --- Máscara de Username em Tempo Real ---
const usernameField = document.getElementById("reg-username");
usernameField.addEventListener("input", (e) => {
  let val = e.target.value;
  // Forçar o prefixo @ se houver conteúdo
  if (val && !val.startsWith("@")) val = "@" + val;
  // Permitir apenas alfanuméricos e underscores após o @
  if (val.length > 1) {
    val = "@" + val.slice(1).replace(/[^a-zA-Z0-9_]/g, "");
  }
  e.target.value = val;

  // Verificação em tempo real (Debounce de 500ms)
  const statusEl = document.getElementById("username-status");
  statusEl.innerText = "";
  clearTimeout(usernameTimer);

  if (val.length > 3) {
    usernameTimer = setTimeout(async () => {
      try {
        const q = query(collection(db, "users"), where("username", "==", val));
        const snap = await getDocs(q);

        if (!snap.empty) {
          statusEl.innerText = "Indisponível";
          statusEl.className = "status-indicator status-taken";
        } else {
          statusEl.innerText = "Disponível";
          statusEl.className = "status-indicator status-available";
        }
      } catch (err) {
        console.error("Erro ao verificar username:", err);
        statusEl.innerText = "Erro na verificação";
      }
    }, 500);
  }
});

// --- Criar Conta ---
document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value.trim();
    const username = document.getElementById("reg-username").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const country = document.getElementById("reg-country").value;
    const password = document.getElementById("reg-password").value;
    const adminCode = document.getElementById("reg-admin-code").value.trim();

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

      // 3. Gravar dados básicos (Sempre como 'user' inicialmente)
      await setDoc(doc(db, "users", user.uid), {
        fullName: name,
        username: normalizedUsername,
        email: email,
        country: country,
        createdAt: serverTimestamp(),
        role: "user",
      });

      // 4. Enviar e-mail de verificação
      await sendEmailVerification(user);

      // 5. Se houver código admin, chamar a Cloud Function de forma segura
      if (adminCode) {
        const verifyAdmin = httpsCallable(functions, "verifyAdminCode");
        await verifyAdmin({ adminCode });
      }

      await syncFavoritesToFirestore(user.uid);

      // Feedback visual e redirecionamento condicional
      msgEl.innerText =
        "Conta criada! Por favor, confirme o seu e-mail para libertar o acesso total.";
      msgEl.style.color = "var(--gold)";
      setTimeout(() => {
        window.location.href = "profile.html";
      }, 3000);
    } catch (error) {
      handleAuthError(error);
    }
  });

// --- Login Normal ---
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const activeMethod =
    document.querySelector(".method-btn.active").dataset.method;
  const btn = document.getElementById("btn-login-submit");

  try {
    if (activeMethod === "email") {
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await syncFavoritesToFirestore(userCredential.user.uid);
      window.location.href = "profile.html";
    } else {
      // Lógica de Telefone
      if (!confirmationResult) {
        initRecaptcha();
        const phoneNumber = document.getElementById("login-phone").value;
        btn.innerText = "A ENVIAR SMS...";
        confirmationResult = await signInWithPhoneNumber(
          auth,
          phoneNumber,
          window.recaptchaVerifier,
        );
        document.getElementById("otp-container").style.display = "block";
        btn.innerText = "VERIFICAR CÓDIGO";
      } else {
        const code = document.getElementById("login-otp").value;
        const result = await confirmationResult.confirm(code);
        const user = result.user;

        // Criar perfil base se for novo utilizador via Telefone
        await setDoc(
          doc(db, "users", user.uid),
          {
            fullName: "Utilizador SMS",
            username: `@user_${user.uid.slice(0, 5)}`,
            email: user.phoneNumber,
            lastLogin: serverTimestamp(),
            role: "user",
          },
          { merge: true },
        );

        await syncFavoritesToFirestore(user.uid);
        window.location.href = "profile.html";
      }
    }
  } catch (error) {
    handleAuthError(error);
    btn.innerText = "Entrar no Painel";
    confirmationResult = null;
  }
});

// --- Recuperar Palavra-passe ---
document
  .getElementById("forgot-password-link")
  .addEventListener("click", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;

    if (!email) {
      msgEl.innerText =
        "Insira o seu e-mail no campo acima para recuperar a senha.";
      msgEl.style.color = "var(--error)";
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      msgEl.innerText = "E-mail de recuperação enviado com sucesso!";
      msgEl.style.color = "var(--success)";
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

      try {
        // Criar perfil no Firestore se for novo utilizador
        await setDoc(
          doc(db, "users", user.uid),
          {
            fullName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: serverTimestamp(),
            role: "user", // Define role padrão
          },
          { merge: true },
        );
      } catch (dbErr) {
        console.error("Erro ao salvar perfil Google no Firestore:", dbErr);
      }

      await syncFavoritesToFirestore(user.uid);

      window.location.href = "profile.html";
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
    case "auth/configuration-not-found":
      message =
        "Erro interno: O método de login não está ativado no Firebase Console.";
      break;
  }

  msgEl.innerText = message;
  msgEl.style.color = "var(--error)";
}
