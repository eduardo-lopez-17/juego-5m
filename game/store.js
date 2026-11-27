// Storage layer. Firebase Realtime Database when configured, otherwise
// a demo store in this browser (localStorage + BroadcastChannel).
window.createStore = function (room, onChange) {
  const cfg = window.FIREBASE_CONFIG;
  const empty = () => ({ state: { phase: 'lobby' }, players: {} });

  if (!cfg) {
    const key = 'fund5m:' + room;
    const bc = 'BroadcastChannel' in window ? new BroadcastChannel(key) : null;
    const read = () => { try { return JSON.parse(localStorage.getItem(key)) || empty(); } catch (e) { return empty(); } };
    const write = (d) => { localStorage.setItem(key, JSON.stringify(d)); bc && bc.postMessage(1); onChange(d); };
    bc && (bc.onmessage = () => onChange(read()));
    window.addEventListener('storage', (e) => { if (e.key === key) onChange(read()); });
    setTimeout(() => onChange(read()), 0);
    return {
      demo: true,
      setState(patch) { const d = read(); d.state = Object.assign({}, d.state, patch); write(d); },
      setPlayer(id, patch) { const d = read(); d.players = d.players || {}; d.players[id] = Object.assign({}, d.players[id], patch); write(d); },
      reset() { write(empty()); }
    };
  }

  // Firebase (compat SDK, loaded on demand so the page also works offline in demo mode)
  const V = '10.12.2';
  const load = (src) => new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
  let ref = null; const queue = [];
  const run = (fn) => (ref ? fn() : queue.push(fn));
  load(`https://www.gstatic.com/firebasejs/${V}/firebase-app-compat.js`)
    .then(() => load(`https://www.gstatic.com/firebasejs/${V}/firebase-database-compat.js`))
    .then(() => {
      firebase.initializeApp(cfg);
      ref = firebase.database().ref('games/' + room);
      ref.on('value', (snap) => { const v = snap.val() || {}; onChange({ state: v.state || { phase: 'lobby' }, players: v.players || {} }); });
      queue.splice(0).forEach((f) => f());
    })
    .catch(() => alert('Could not connect to Firebase. Check config.js and your internet connection.'));
  return {
    demo: false,
    setState(patch) { run(() => ref.child('state').update(patch)); },
    setPlayer(id, patch) { run(() => ref.child('players/' + id).update(patch)); },
    reset() { run(() => ref.set({ state: { phase: 'lobby' }, players: {} })); }
  };
};
