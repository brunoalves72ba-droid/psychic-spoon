// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Armazenamento local (IndexedDB) com esquema versionado, migração e backup.
// Tudo fica só no aparelho. Sem servidor, sem login, sem analytics.

export const DB_NAME = 'sexteto';
export const SCHEMA = 2; // versão do banco e do arquivo de backup

/** Migrações do banco: índice = versão de destino. */
const MIGRATIONS = {
  1(db) {
    db.createObjectStore('kv');
    const ev = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
    ev.createIndex('type', 'type');
    db.createObjectStore('recordings', { keyPath: 'id', autoIncrement: true });
    db.createObjectStore('blobs');
  },
  2(db, tx) {
    db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
    tx.objectStore('events').createIndex('day', 'day');
  },
};

let dbp = null;
let mem = null; // alternativa em memória quando não há IndexedDB

function memStore() {
  const stores = { kv: new Map(), events: new Map(), recordings: new Map(), blobs: new Map(), projects: new Map() };
  const seq = { events: 0, recordings: 0, projects: 0 };
  return { stores, seq };
}

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') { mem = memStore(); resolve(null); return; }
    let req;
    try { req = indexedDB.open(DB_NAME, SCHEMA); } catch { mem = memStore(); resolve(null); return; }
    req.onupgradeneeded = (e) => {
      const db = req.result;
      for (let v = e.oldVersion + 1; v <= SCHEMA; v++) MIGRATIONS[v](db, req.transaction);
    };
    req.onsuccess = () => { req.result.onversionchange = () => req.result.close(); resolve(req.result); };
    req.onerror = () => { mem = memStore(); resolve(null); };
    req.onblocked = () => { mem = memStore(); resolve(null); };
  });
  return dbp;
}
const P = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });

async function run(store, mode, fn) {
  const db = await open();
  if (!db) return fn(null, mem);
  const tx = db.transaction(store, mode);
  const out = await fn(tx.objectStore(store));
  if (mode === 'readwrite') await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
  return out;
}
const get = (store, key) => run(store, 'readonly', (os, m) => (os ? P(os.get(key)) : m.stores[store].get(key)));
const all = (store) => run(store, 'readonly', (os, m) => (os ? P(os.getAll()) : [...m.stores[store].values()]));
const put = (store, val, key) => run(store, 'readwrite', (os, m) => {
  if (os) return P(key === undefined ? os.put(val) : os.put(val, key));
  if (key === undefined) { if (val.id == null) val.id = ++m.seq[store]; else m.seq[store] = Math.max(m.seq[store], val.id); key = val.id; }
  m.stores[store].set(key, val); return key;
});
const del = (store, key) => run(store, 'readwrite', (os, m) => (os ? P(os.delete(key)) : m.stores[store].delete(key)));
const wipe = (store) => run(store, 'readwrite', (os, m) => (os ? P(os.clear()) : m.stores[store].clear()));

// ---------- chave/valor e preferências ----------
export const kv = {
  async get(key, def) { const v = await get('kv', key); return v === undefined ? def : v; },
  set: (key, val) => put('kv', val, key),
  del: (key) => del('kv', key),
};

const PREF_DEFAULTS = { solfege: true, fones: false, a4: 440, latencyMs: null, octave: 0 };
let prefCache = { ...PREF_DEFAULTS };
export const prefs = {
  async load() { prefCache = { ...PREF_DEFAULTS, ...(await kv.get('prefs', {})) }; return prefCache; },
  get: (k) => prefCache[k],
  async set(k, v) { prefCache[k] = v; await kv.set('prefs', prefCache); },
  all: () => ({ ...prefCache }),
};

// ---------- histórico ----------
const dk = (ts) => { const t = new Date(ts); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };

/** Registra um resultado mensurável com data. */
export async function log(type, data, ts = Date.now()) {
  const ev = { type, ts, day: dk(ts), data };
  ev.id = await put('events', ev);
  askPersist();
  return ev;
}
/** Lista o histórico (opcionalmente de um tipo), do mais antigo ao mais novo. */
export async function events(type) {
  let list;
  if (type) list = await run('events', 'readonly', (os, m) => (os ? P(os.index('type').getAll(type)) : [...m.stores.events.values()].filter((e) => e.type === type)));
  else list = await all('events');
  return list.sort((a, b) => a.ts - b.ts);
}
export async function lastEvent(type) { const l = await events(type); return l[l.length - 1] || null; }
export const deleteEvent = (id) => del('events', id);

/** Soma segundos de prática na seção, no dia de hoje. */
export async function addPractice(section, seconds, ts = Date.now()) {
  if (!(seconds > 0)) return;
  const p = await kv.get('practice', {});
  const d = dk(ts);
  p[d] = p[d] || {};
  p[d][section] = (p[d][section] || 0) + seconds;
  await kv.set('practice', p);
}
export const practice = () => kv.get('practice', {});
/** Dias seguidos com prática, contando até hoje (ou ontem, se hoje ainda não praticou). */
export function streak(p, today = new Date()) {
  const has = (d) => { const o = p[dk(d)]; return !!o && Object.values(o).reduce((a, b) => a + b, 0) >= 30; };
  const d = new Date(today); d.setHours(12, 0, 0, 0);
  if (!has(d)) d.setDate(d.getDate() - 1);
  let n = 0;
  while (has(d)) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/** Roteiro do dia: marca etapas feitas hoje. */
export const roteiro = {
  async today() { const r = await kv.get('roteiro', {}); return r[dk(Date.now())] || {}; },
  async mark(step) { const r = await kv.get('roteiro', {}); const d = dk(Date.now()); const keep = {}; keep[d] = { ...(r[d] || {}), [step]: true }; await kv.set('roteiro', keep); },
};

// ---------- gravações (PCM cru de 16 bits) ----------
export function floatToInt16(f) {
  const o = new Int16Array(f.length);
  for (let i = 0; i < f.length; i++) { const x = Math.max(-1, Math.min(1, f[i])); o[i] = x < 0 ? x * 32768 : x * 32767; }
  return o;
}
export function int16ToFloat(a) {
  const o = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) o[i] = a[i] / 32768;
  return o;
}
/** Salva uma gravação mono. pcm: Float32Array ou Int16Array. Retorna o id. */
export async function saveRecording({ name, kind = 'livre', sampleRate, pcm, extra = {} }) {
  const data = pcm instanceof Int16Array ? pcm : floatToInt16(pcm);
  const meta = { name, kind, sampleRate, length: data.length, bytes: data.byteLength, ts: Date.now(), extra };
  meta.id = await put('recordings', meta);
  await put('blobs', data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), meta.id);
  askPersist();
  return meta.id;
}
export const listRecordings = async () => (await all('recordings')).sort((a, b) => b.ts - a.ts);
export const getRecordingMeta = (id) => get('recordings', id);
export async function getRecordingPcm(id) { const b = await get('blobs', id); return b ? int16ToFloat(new Int16Array(b)) : null; }
export async function deleteRecording(id) { await del('recordings', id); await del('blobs', id); }

// ---------- projetos do gravador ----------
export const saveProject = async (p) => { p.updated = Date.now(); p.id = await put('projects', p); return p.id; };
export const listProjects = async () => (await all('projects')).sort((a, b) => b.updated - a.updated);
export const getProject = (id) => get('projects', id);
export const deleteProject = (id) => del('projects', id);

// ---------- espaço e persistência ----------
let asked = false;
export async function askPersist() {
  if (asked) return; asked = true;
  try { if (navigator.storage && navigator.storage.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); } catch {}
}
export async function usage() {
  const recs = await all('recordings');
  const recBytes = recs.reduce((a, r) => a + (r.bytes || 0), 0);
  let est = null, persisted = null;
  try { if (navigator.storage && navigator.storage.estimate) est = await navigator.storage.estimate(); } catch {}
  try { if (navigator.storage && navigator.storage.persisted) persisted = await navigator.storage.persisted(); } catch {}
  return { recBytes, recCount: recs.length, used: est ? est.usage : null, quota: est ? est.quota : null, persisted };
}

// ---------- backup ----------
function b64(buf) {
  const u = new Uint8Array(buf); let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}
function unb64(str) {
  const s = atob(str); const u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u.buffer;
}

export async function exportAll() {
  const db = await open();
  const kvPairs = await run('kv', 'readonly', async (os, m) => {
    if (!os) return [...m.stores.kv.entries()];
    const [keys, vals] = await Promise.all([P(os.getAllKeys()), P(os.getAll())]);
    return keys.map((k, i) => [k, vals[i]]);
  });
  const recs = await all('recordings');
  const recordings = [];
  for (const r of recs) { const b = await get('blobs', r.id); recordings.push({ ...r, pcm16: b ? b64(b) : '' }); }
  void db;
  return { app: 'sexteto', schema: SCHEMA, exportedAt: new Date().toISOString(), owner: 'Bruno Moura', kv: kvPairs, events: await all('events'), recordings, projects: await all('projects') };
}

/** Atualiza um backup antigo para o esquema atual. */
export function migrateBackup(data) {
  if (!data || data.app !== 'sexteto' || typeof data.schema !== 'number') throw new Error('Este arquivo não é um backup do Sexteto.');
  if (data.schema > SCHEMA) throw new Error('Backup feito em uma versão mais nova do app. Atualize o app e tente de novo.');
  const d = { ...data };
  if (d.schema < 2) {
    d.projects = d.projects || [];
    d.events = (d.events || []).map((e) => ({ ...e, day: e.day || dk(e.ts) }));
    d.schema = 2;
  }
  d.kv = d.kv || []; d.events = d.events || []; d.recordings = d.recordings || []; d.projects = d.projects || [];
  return d;
}

/** Importa um backup, substituindo tudo o que existe. */
export async function importAll(raw) {
  const d = migrateBackup(raw);
  for (const st of ['kv', 'events', 'recordings', 'blobs', 'projects']) await wipe(st);
  for (const [k, v] of d.kv) await put('kv', v, k);
  for (const e of d.events) await put('events', e);
  for (const r of d.recordings) {
    const { pcm16, ...meta } = r;
    await put('recordings', meta);
    if (pcm16) await put('blobs', unb64(pcm16), meta.id);
  }
  for (const p of d.projects) await put('projects', p);
  await prefs.load();
  return { events: d.events.length, recordings: d.recordings.length, projects: d.projects.length };
}

export async function wipeAll() { for (const st of ['kv', 'events', 'recordings', 'blobs', 'projects']) await wipe(st); await prefs.load(); }
/** Só para testes. */
export function _reset() { dbp = null; mem = null; asked = false; }
