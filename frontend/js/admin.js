import { auth, db, storage } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const loginSection = document.getElementById("login-section");
const adminSection = document.getElementById("admin-section");

// --- Auth State ---
onAuthStateChanged(auth, (user) => {
  loginSection.style.display = user ? "none" : "block";
  adminSection.style.display = user ? "block" : "none";
});

// --- Login ---
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const pass = document.getElementById("login-password").value;
  const msg = document.getElementById("login-msg");
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    msg.innerText = "Acesso negado. Verifica as credenciais.";
    msg.style.display = "block";
  }
});

// --- Logout ---
document
  .getElementById("btn-logout")
  .addEventListener("click", () => signOut(auth));

// --- Upload e Publicação ---
document
  .getElementById("publish-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-publish");
    const msg = document.getElementById("publish-msg");
    const fileInput = document.getElementById("book-file");

    btn.disabled = true;
    btn.innerText = "A carregar PDF...";

    try {
      let arquivoUrl = "";
      const file = fileInput.files[0];

      if (file) {
        // Criar referência única no Storage
        const storageRef = ref(storage, `ebooks/${Date.now()}_${file.name}`);
        // Fazer o upload
        const snapshot = await uploadBytes(storageRef, file);
        // Obter URL pública
        arquivoUrl = await getDownloadURL(snapshot.ref);
      }

      btn.innerText = "A guardar dados...";

      const bookData = {
        titulo: document.getElementById("book-title").value,
        autor: document.getElementById("book-author").value,
        preco: parseFloat(document.getElementById("book-price").value),
        imagem: document.getElementById("book-image").value,
        arquivoUrl: arquivoUrl, // URL vinda do Storage
        categoriaTag: document.getElementById("book-category").value,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "books"), bookData);

      msg.innerText = "Sucesso! Livro e PDF publicados.";
      msg.className = "message success";
      document.getElementById("publish-form").reset();
    } catch (err) {
      console.error(err);
      msg.innerText = "Erro ao publicar. Verifica Storage/Firestore.";
      msg.className = "message error";
    } finally {
      msg.style.display = "block";
      btn.disabled = false;
      btn.innerText = "Publicar Livro";
    }
  });
