// ===================================================================
//  CONFIGURACIÓN
//  Mientras FIREBASE_CONFIG sea null, el juego corre en MODO DEMO:
//  todo se guarda en este navegador y puedes probarlo abriendo la
//  pantalla del presentador y la del jugador en dos pestañas.
//
//  Para jugar en vivo con celulares, pega aquí el objeto de
//  configuración que te da Firebase (ver README.md, paso 2).
// ===================================================================
window.FIREBASE_CONFIG = null;

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBh2ZXcSnEChI1nidcg0uj43RcDGKda-Ko",
  authDomain: "fintech-2e8eb.firebaseapp.com",
  databaseURL: "https://fintech-2e8eb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fintech-2e8eb",
  storageBucket: "fintech-2e8eb.firebasestorage.app",
  messagingSenderId: "848457728313",
  appId: "1:848457728313:web:34786f9535d8e2690028e8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

/* Ejemplo de cómo se ve cuando ya lo pegaste:
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "fondo-5m.firebaseapp.com",
  databaseURL: "https://fondo-5m-default-rtdb.firebaseio.com",
  projectId: "fondo-5m",
  storageBucket: "fondo-5m.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
*/
