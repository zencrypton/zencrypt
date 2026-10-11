/*
   ZENCRYPT - assets/js/app.js
   Extracted VERBATIM from index.html.html - not minified, not compressed.
   Full quality preserved.
   Loaded from docs/index.html as:  <script src="assets/js/app.js"></script>
   (placed at end of <body>, so no defer needed - DOM is ready on run)

   ============================================================================ */


'use strict';
/* ================= helpers ================= */
const $ = s => document.querySelector(s);
const wait = ms => new Promise(r => setTimeout(r, ms));
const p2 = n => String(n).padStart(2, '0');
const HEX = '0123456789ABCDEF';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* inline icon set (no external icon dependency) */
const I = {
  dl:'<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/>',
  trash:'<path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="m6 7 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  eyeoff:'<path d="m4 4 16 16"/><path d="M10.6 6c.46-.07.93-.1 1.4-.1 6 0 9.5 6.1 9.5 6.1a17 17 0 0 1-2.4 3.1"/><path d="M6.7 6.9C4.1 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.5 0 2.9-.37 4.2-1"/><path d="M9.9 9.9a2.9 2.9 0 0 0 4.1 4.1"/>',
  arrow:'<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
  unlock:'<rect x="4.5" y="10.5" width="15" height="10" rx="1"/><path d="M8 10.5V7a4 4 0 0 1 7.7-1.5"/>',
  x:'<path d="m6 6 12 12"/><path d="M18 6 6 18"/>',
  check:'<path d="M5 12.5 10 17.5 19 7"/>',
  spin:'<path d="M12 3a9 9 0 1 0 9 9"/>'
};
const icon = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

/* ================= hashing ================= */
function fnvHex(u8){ // fallback fingerprint when WebCrypto is unavailable
  let h = 0x811c9dc5;
  for (let i = 0; i < u8.length; i++){ h ^= u8[i]; h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8,'0').repeat(8);
}
async function sha256Buf(buf){
  if (crypto?.subtle){
    const d = await crypto.subtle.digest('SHA-256', buf);
    return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2,'0')).join('');
  }
  return fnvHex(new Uint8Array(buf));
}
const sha256Text = s => sha256Buf(new TextEncoder().encode(s).buffer);
const shortHash = h => h ? h.slice(0,4) + '…' + h.slice(-4) : '········';

/* ================= IndexedDB ================= */
let db;
const openDB = () => new Promise((res, rej) => {
  const q = indexedDB.open('zencrypt', 1);
  q.onupgradeneeded = () => q.result.createObjectStore('files', { keyPath: 'id' });
  q.onsuccess = () => res(q.result);
  q.onerror = () => rej(q.error);
});
const store = m => db.transaction('files', m).objectStore('files');
const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const dbAll = () => req(store('readonly').getAll());
const dbPut = rec => req(store('readwrite').put(rec));
const dbDel = id  => req(store('readwrite').delete(id));

/* ================= formatting ================= */
function fmtSize(b){
  if (b < 1024) return b + ' B';
  const u = ['KB','MB','GB','TB']; let i = -1, n = b;
  do { n /= 1024; i++; } while (n >= 1024 && i < u.length - 1);
  return n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2) + ' ' + u[i];
}
function fmtDate(ts){
  const d = new Date(ts);
  return `${d.getFullYear()}.${p2(d.getMonth()+1)}.${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}
function extLabel(r){
  const m = (r.name.match(/\.([a-z0-9]{1,4})$/i) || [])[1];
  return (m || (r.type || '').split('/')[1] || 'file').toUpperCase().slice(0,4);
}
const uid = () => crypto.randomUUID
  ? crypto.randomUUID()
  : [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2,'0')).join('');

/* ================= tiny sound design ================= */
let AC;
function beep(kind){
  if (RM) return;
  try{
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.connect(g); g.connect(AC.destination);
    if (kind === 'thunk'){
      o.type='sine'; o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(46,t+.16);
      g.gain.setValueAtTime(.001,t); g.gain.exponentialRampToValueAtTime(.28,t+.015); g.gain.exponentialRampToValueAtTime(.001,t+.22);
      o.start(t); o.stop(t+.24);
    } else if (kind === 'deny'){
      o.type='sawtooth'; o.frequency.setValueAtTime(120,t);
      g.gain.setValueAtTime(.06,t); g.gain.exponentialRampToValueAtTime(.001,t+.14);
      o.start(t); o.stop(t+.15);
    } else {
      o.type='sine'; o.frequency.setValueAtTime(740,t);
      g.gain.setValueAtTime(.001,t); g.gain.exponentialRampToValueAtTime(.07,t+.01); g.gain.exponentialRampToValueAtTime(.001,t+.09);
      o.start(t); o.stop(t+.1);
    }
  }catch(e){}
}

/* ================= toasts ================= */
const toasts = $('#toasts');
function toast(msg, kind = 'ok'){
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `${icon(kind === 'err' ? 'x' : 'check')}<span></span>`;
  el.lastElementChild.textContent = msg;
  toasts.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 380); }, 3400);
}

/* ================= text scramble ================= */
const SCR = '0123456789ABCDEF#%&$+<>*';
function scramble(el, final, dur){
  if (RM || dur <= 0){ el.textContent = final; return; }
  const arr = [...final], t0 = performance.now();
  (function tick(t){
    const p = Math.min(1, (t - t0) / dur);
    const k = Math.floor(p * arr.length);
    let s = arr.slice(0, k).join('');
    for (let i = k; i < arr.length; i++) s += SCR[(Math.random() * SCR.length) | 0];
    el.textContent = s;
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

/* ================= cipher ring ================= */
const NS = 'http://www.w3.org/2000/svg';
const gChars = $('#gChars'), gTicks = $('#gTicks'), chars = [];
(function buildRing(){
  for (let i = 0; i < 40; i++){
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', 0); t.setAttribute('y', -208);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('transform', `rotate(${i * 9})`);
    t.textContent = HEX[i % 16];
    gChars.appendChild(t); chars.push(t);
  }
  for (let i = 0; i < 72; i++){
    const l = document.createElementNS(NS, 'line');
    const major = i % 6 === 0;
    l.setAttribute('y1', major ? -164 : -170); l.setAttribute('y2', -177);
    l.setAttribute('transform', `rotate(${i * 5})`);
    if (major) l.classList.add('tk-a');
    gTicks.appendChild(l);
  }
})();
let angle = 0, angle2 = 0, boost = 0, scrollSpin = 0, last = performance.now();
(function loop(t){
  const dt = Math.min(.05, (t - last) / 1000); last = t;
  boost = Math.max(0, boost - dt * .9);
  const sp = RM ? 0 : 7 + boost * 70;
  angle = (angle + sp * dt) % 360;
  angle2 = (angle2 - sp * .45 * dt) % 360;
  gChars.setAttribute('transform', `rotate(${angle + scrollSpin})`);
  gTicks.setAttribute('transform', `rotate(${angle2 - scrollSpin})`);
  requestAnimationFrame(loop);
})(last);
function jitterChars(n){
  for (let i = 0; i < n; i++){
    const el = chars[(Math.random() * chars.length) | 0];
    el.textContent = HEX[(Math.random() * 16) | 0];
    el.classList.add('hot');
    setTimeout(() => el.classList.remove('hot'), 300 + Math.random() * 250);
  }
}

/* ================= records / ledger ================= */
const rowsBox = $('#rows'), emptyBox = $('#emptyBox');
const records = new Map();

const actionsHTML = () =>
  `<button class="act" data-act="dl" title="Retrieve file" aria-label="Retrieve file">${icon('dl')}</button>` +
  `<button class="act danger" data-act="del" title="Purge record" aria-label="Purge record">${icon('trash')}</button>`;

function rowEl(rec, pending){
  const el = document.createElement('div');
  el.className = 'row'; el.dataset.id = rec.id;
  el.innerHTML = `
    <span class="c-idx">00</span>
    <div class="c-file">
      <span class="f-dot ${pending ? 'pend' : ''}"></span>
      <span class="f-name"></span>
      <span class="f-chip">${extLabel(rec)}</span>
      <span class="f-state ${pending ? 'pend' : ''}">${pending ? 'SEALING' : 'SEALED'}</span>
    </div>
    <span class="c-hash">${rec.hash ? shortHash(rec.hash) : '········'}</span>
    <span class="c-size">${fmtSize(rec.size)}</span>
    <span class="c-date">${fmtDate(rec.date)}</span>
    <div class="c-act">${actionsHTML()}</div>`;
  el.querySelector('.f-name').textContent = rec.name; // safe: filename as text
  return el;
}
function renumber(){
  [...rowsBox.children].forEach((el, i) => el.querySelector('.c-idx').textContent = p2(i + 1));
}
function refreshStats(){
  const rs = [...records.values()];
  const n = rs.length, bytes = rs.reduce((s, r) => s + (r.size || 0), 0);
  $('#statCount').textContent = p2(n);
  $('#statSize').textContent = fmtSize(bytes);
  $('#ledgerCount').textContent = `${p2(n)} RECORD${n === 1 ? '' : 'S'}`;
  $('#footStats').textContent = `${p2(n)} SEALED RECORDS · ${fmtSize(bytes)} ON DEVICE · KEY VERIFIED`;
  emptyBox.hidden = n > 0;
}
async function loadRecords(){
  try{
    const all = (await dbAll()).sort((a, b) => b.date - a.date);
    for (const r of all){
      records.set(r.id, r);
      const el = rowEl(r, false);
      el.querySelector('.c-hash').textContent = shortHash(r.hash || '');
      rowsBox.appendChild(el);
    }
    renumber(); refreshStats();
  }catch(e){
    toast('Local vault unavailable in this browser', 'err');
  }
}

/* ---- sealing ---- */
async function sealOne(f, delay){
  if (delay) await wait(delay);
  const rec = { id: uid(), name: f.name, size: f.size, type: f.type || '', date: Date.now(), hash: '', blob: f };
  const el = rowEl(rec, true);
  rowsBox.prepend(el); records.set(rec.id, rec);
  renumber(); emptyBox.hidden = true;

  let buf = null;
  try{ buf = await f.arrayBuffer(); }catch(e){}
  rec.hash = buf ? await sha256Buf(buf)
                 : fnvHex(new TextEncoder().encode(f.name + ':' + f.size));
  try{ await dbPut(rec); }
  catch(e){ toast('Storage failed — record kept for this session only', 'err'); }

  const dur = RM ? 0 : 720 + Math.random() * 380;
  scramble(el.querySelector('.f-name'), rec.name, dur);
  scramble(el.querySelector('.c-hash'), shortHash(rec.hash), dur);
  await wait(dur + 120);
  el.querySelector('.f-dot').classList.remove('pend');
  const st = el.querySelector('.f-state');
  st.textContent = 'SEALED'; st.classList.remove('pend');
  beep('seal');
}
async function sealFiles(list){
  const files = [...list];
  if (!files.length) return;
  await Promise.all(files.map((f, i) => sealOne(f, i * 220)));
  refreshStats();
  toast(files.length === 1 ? `${files[0].name} sealed` : `${files.length} files sealed — index updated`);
}

/* ---- row actions ---- */
function armDelete(row){
  rowsBox.querySelectorAll('.row.confirm').forEach(r => { if (r !== row) disarm(r); });
  row.classList.add('confirm');
  row.querySelector('.c-act').innerHTML =
    `<span class="cf-label">PURGE?</span>` +
    `<button class="act cf-yes" data-act="yes">YES</button>` +
    `<button class="act" data-act="no">NO</button>`;
}
function disarm(row){
  row.classList.remove('confirm');
  row.querySelector('.c-act').innerHTML = actionsHTML();
}
async function doDelete(row, id){
  const rec = records.get(id);
  row.style.height = row.offsetHeight + 'px'; void row.offsetHeight;
  row.style.transition = 'height .38s var(--ease),opacity .3s,padding .38s,border-color .38s';
  row.classList.add('gone'); row.style.height = '0px';
  try{ await dbDel(id); }catch(e){}
  records.delete(id);
  setTimeout(() => { row.remove(); renumber(); refreshStats(); }, 400);
  toast(`Purged — ${rec ? rec.name : 'record'}`, 'err');
}
function download(id){
  const r = records.get(id);
  if (!r || !r.blob){ toast('Record not found', 'err'); return; }
  const url = URL.createObjectURL(r.blob);
  const a = document.createElement('a');
  a.href = url; a.download = r.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast(`Retrieved — ${r.name}`);
}
rowsBox.addEventListener('click', e => {
  const b = e.target.closest('button[data-act]');
  if (!b) return;
  const row = e.target.closest('.row'), id = row.dataset.id;
  if (b.dataset.act === 'dl') download(id);
  else if (b.dataset.act === 'del') armDelete(row);
  else if (b.dataset.act === 'yes') doDelete(row, id);
  else if (b.dataset.act === 'no') disarm(row);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') rowsBox.querySelectorAll('.row.confirm').forEach(disarm);
});

/* ================= gate & unlock ================= */
const gate = $('#gate'), vault = $('#vault'), form = $('#keyForm'), input = $('#keyInput');
const goBtn = $('#goBtn'), keyErr = $('#keyErr'), keyHint = $('#keyHint'), stamp = $('#stamp');
const KEY = 'devwillbethere';
let KEY_HASH = '', busy = false, attempts = 0;
sha256Text(KEY).then(h => KEY_HASH = h);

function deny(empty){
  attempts++;
  keyErr.textContent = empty ? 'KEY REQUIRED' : `ACCESS DENIED — ATTEMPT ${p2(attempts)}`;
  if (attempts >= 2) keyHint.hidden = false;
  form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
  gate.classList.add('deny'); setTimeout(() => gate.classList.remove('deny'), 600);
  beep('deny');
  input.value = ''; input.focus();
}
function unlock(){
  busy = true;
  keyErr.textContent = ''; input.blur();
  goBtn.innerHTML = icon('spin'); goBtn.classList.add('busy');
  boost = 9; // ring spins up
  setTimeout(() => { stamp.hidden = false; stamp.classList.add('show'); beep('thunk'); }, 420);
  setTimeout(() => document.body.classList.add('doors-closed'), 1150);
  setTimeout(() => beep('thunk'), 1860); // doors meet
  setTimeout(() => {
    stamp.hidden = true; stamp.classList.remove('show');
    gate.classList.add('off');
    document.body.classList.remove('gated');
    vault.hidden = false; void vault.offsetHeight; vault.classList.add('in');
  }, 1900);
  setTimeout(() => document.body.classList.remove('doors-closed'), 2150);
  setTimeout(() => {
    goBtn.classList.remove('busy'); goBtn.innerHTML = icon('arrow');
    input.value = ''; busy = false;
    toast('Vault open — access key verified');
  }, 3050);
}
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (busy) return;
  const v = input.value.trim();
  if (!v){ deny(true); return; }
  busy = true;
  goBtn.innerHTML = icon('spin'); goBtn.classList.add('busy');
  const keyHash = KEY_HASH || await sha256Text(KEY);
  const h = await sha256Text(v);
  if (h === keyHash){ unlock(); }
  else {
    deny(false);
    busy = false;
    goBtn.classList.remove('busy'); goBtn.innerHTML = icon('arrow');
  }
});
input.addEventListener('input', () => {
  boost = Math.min(3.5, boost + .4);
  if (!RM) jitterChars(3);
});
 $('#eyeBtn').addEventListener('click', () => {
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  $('#eyeBtn').innerHTML = icon(show ? 'eyeoff' : 'eye');
  input.focus();
});

function lockVault(){
  if (busy || vault.hidden) return;
  busy = true;
  document.body.classList.add('doors-closed');
  setTimeout(() => beep('thunk'), 700);
  setTimeout(() => {
    vault.hidden = true; vault.classList.remove('in');
    gate.classList.remove('off');
    gateInner.scrollTop = 0; // lock view returns to the key, not the seal section
    document.body.classList.add('gated');
    attempts = 0; keyHint.hidden = true; keyErr.textContent = '';
    input.value = '';
  }, 780);
  setTimeout(() => document.body.classList.remove('doors-closed'), 1050);
  setTimeout(() => { busy = false; input.focus(); }, 1900);
}

/* ================= uploads: click / drop / paste ================= */
const dz = $('#dz'), dzGate = $('#dzGate'), fileInput = $('#fileInput');
const activeDz = () => vault.hidden ? dzGate : dz;
function dzOver(el, on){
  el.classList.toggle('over', on);
  el.querySelector('.dz-a').hidden = on;
  el.querySelector('.dz-b').hidden = !on;
}
[dz, dzGate].forEach(el => {
  el.addEventListener('click', () => fileInput.click());
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fileInput.click(); } });
});
fileInput.addEventListener('change', () => { sealFiles(fileInput.files); fileInput.value = ''; });

let dragDepth = 0;
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('dragenter', e => {
  e.preventDefault();
  if (!e.dataTransfer?.types?.includes('Files')) return;
  dragDepth++; dzOver(activeDz(), true);
});
window.addEventListener('dragleave', () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (!dragDepth) [dz, dzGate].forEach(el => dzOver(el, false));
});
window.addEventListener('drop', e => {
  e.preventDefault();
  dragDepth = 0; [dz, dzGate].forEach(el => dzOver(el, false));
  if (!e.dataTransfer?.files?.length) return;
  sealFiles(e.dataTransfer.files);
});
window.addEventListener('paste', e => {
  const fs = e.clipboardData?.files;
  if (fs && fs.length) sealFiles(fs);
});

/* scroll-driven ring spin — the home page scrolls now */
const gateInner = document.querySelector('.gate-inner');
let lastSpinY = 0;
gateInner.addEventListener('scroll', () => {
  const y = gateInner.scrollTop;
  scrollSpin = y * .35;
  boost = Math.min(9, boost + Math.abs(y - lastSpinY) * .01);
  lastSpinY = y;
}, { passive: true });

/* ================= boot ================= */
 $('#eyeBtn').innerHTML = icon('eye');
 $('#goBtn').innerHTML = icon('arrow');
 $('#lockBtn').innerHTML = icon('unlock') + '<span>LOCK</span>';
 $('#lockBtn').addEventListener('click', lockVault);
 $('#sessionId').textContent = [...crypto.getRandomValues(new Uint8Array(4))]
  .map(b => b.toString(16).padStart(2,'0')).join('').toUpperCase();

const clocks = [$('#gateClock'), $('#vClock')];
function tickClock(){
  const d = new Date();
  const t = `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
  clocks.forEach(c => c.textContent = t);
}
tickClock(); setInterval(tickClock, 1000);

/* entrance stagger order for the vault */
document.querySelectorAll('#vault .rv').forEach((el, i) => el.style.transitionDelay = (0.07 * i) + 's');

if (!matchMedia('(pointer:coarse)').matches) input.focus();
openDB().then(d => { db = d; loadRecords(); }).catch(() => toast('Local vault unavailable in this browser', 'err'));
