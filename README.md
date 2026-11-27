# The $5M Fund: juego en vivo sobre Knightian uncertainty

Dos pantallas:
- `game/index.html`: pantalla del **presentador** (va en el proyector, o embebida en la página base).
- `game/play.html`: pantalla del **jugador** (se abre en el celular con el código QR).

El juego está en inglés porque la presentación es en inglés.

## Cómo funciona

GitHub Pages solo sirve archivos: no puede guardar los votos. Por eso las inversiones de los celulares se guardan en **Firebase Realtime Database** (gratis). La pantalla del presentador lee esos datos en vivo.

Mientras `game/config.js` no tenga la configuración de Firebase, el juego corre en **modo demo**: todo vive en tu navegador y lo puedes probar con varias pestañas.

---

## Paso 1. Subirlo a GitHub Pages (10 min)

1. En GitHub crea un repositorio **público**, por ejemplo `fondo-5m`.
2. Pulsa **Add file → Upload files** y arrastra todo el contenido de esta carpeta (la carpeta `game`, `README.md` y `embed-example.html`). Pulsa **Commit changes**.
3. Ve a **Settings → Pages**. En "Branch" elige `main` y `/ (root)`, y guarda.
4. Espera 1 o 2 minutos. El juego queda en:
   `https://TU-USUARIO.github.io/fondo-5m/game/`

## Paso 2. Probar en modo demo (sin Firebase)

1. Abre `https://TU-USUARIO.github.io/fondo-5m/game/`. Arriba verás la franja "DEMO MODE".
2. Pulsa **Open a player tab** dos o tres veces. Cada pestaña es un jugador distinto.
3. Pulsa **+ 10 test players** para simular a la clase.
4. Recorre todo el juego con **Next ▶** (o la flecha → del teclado) e invierte desde las pestañas de jugador.
5. Pulsa **Reset game** dos veces para borrar todo.

> En modo demo los celulares **no** se conectan, porque cada dispositivo guarda sus propios datos. Para eso es el paso 3.

## Paso 3. Conectar Firebase para jugar con celulares (5 a 10 min)

1. Entra a <https://console.firebase.google.com> con tu cuenta de Google y pulsa **Create a project** (puedes desactivar Google Analytics).
2. En el menú: **Build → Realtime Database → Create database**. Elige una ubicación (por ejemplo `asia-southeast1`) y **Start in test mode**.
3. En la pestaña **Rules** de la base de datos pega esto y pulsa **Publish**:
   ```json
   {
     "rules": {
       "games": { "$room": { ".read": true, ".write": true } },
       ".read": false,
       ".write": false
     }
   }
   ```
4. Ve al engrane **Project settings → General → Your apps** y pulsa el icono web `</>`. Ponle un nombre, regístrala y copia el objeto `firebaseConfig` (debe incluir `databaseURL`).
5. En GitHub abre `game/config.js`, pulsa el lápiz para editar y cambia `window.FIREBASE_CONFIG = null;` por tu configuración, así:
   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "...",
     authDomain: "...",
     databaseURL: "https://...firebasedatabase.app",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
   Guarda con **Commit changes** y espera 1 minuto.
6. Recarga la pantalla del presentador. La franja "DEMO MODE" debe desaparecer.

Las claves de Firebase de una página web no son secretas; lo que protege los datos son las reglas del punto 3. Cuando termine la clase puedes borrar el proyecto de Firebase.

## Paso 4. Ensayo real antes de la clase

1. Abre el presentador en la laptop y escanea el QR con 2 o 3 celulares del equipo (con datos móviles y con el wifi de la escuela).
2. Juega una partida completa y mide el tiempo (la meta son 6 minutos).
3. Si quieres más jugadores falsos en el ensayo, abre `game/index.html?test=1`: aparece el botón **+ 10 test players**.
4. Al terminar pulsa **Reset game** dos veces.

**El día de la presentación:** abre `game/index.html?room=clase` para usar una sala limpia (puedes usar cualquier nombre de sala). El QR ya apunta a esa sala.

## Paso 5. Meterlo en la página base

Copia el bloque de `embed-example.html` en la sección de la actividad de la página base y cambia la URL. Así el juego se ve dentro de la presentación, pero también funciona solo en su propia URL. Si el iframe se ve pequeño en el proyector, usa el enlace "Open the game full screen".

## Controles del presentador

| Botón | Qué hace |
| --- | --- |
| Next ▶ / flecha → | Avanza de fase. "Launch!" sortea la Ronda 1 y "Reveal the news" sortea la carta al azar |
| ◀ Back / flecha ← | Regresa una fase (no vuelve a sortear) |
| Reset game (2 clics) | Borra jugadores y resultados de esa sala |

Fases: Join → Round 1 (40 s) → Results → Round 2 first investment (40 s) → Breaking news → Late investment (30 s) → The future → What we learned.

## Plan B (si falla el wifi)

Juega por equipos: 4 equipos deciden en voz alta y tú abres 4 pestañas de jugador en la laptop (en modo demo o con `?room=planb`) y capturas sus decisiones.
