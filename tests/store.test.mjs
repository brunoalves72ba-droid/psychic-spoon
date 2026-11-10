import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as store from '../js/core/store.js';

test('histórico, prática e sequência de dias', async () => {
  await store.log('ear', { kind: 'intervalos', ok: 7, total: 10 });
  await store.log('breath', { seconds: 21 });
  assert.equal((await store.events('ear')).length, 1);
  assert.equal((await store.events()).length, 2);
  const today = new Date(); const y = new Date(today); y.setDate(y.getDate() - 1); const y2 = new Date(today); y2.setDate(y2.getDate() - 2);
  await store.addPractice('voz', 120, y2.getTime()); await store.addPractice('voz', 90, y.getTime()); await store.addPractice('harmonia', 60);
  assert.equal(store.streak(await store.practice()), 3);
  assert.equal(store.streak({}), 0);
});

test('gravações: PCM de 16 bits vai e volta', async () => {
  const pcm = new Float32Array(4800); for (let i = 0; i < pcm.length; i++) pcm[i] = Math.sin(i / 10) * 0.5;
  const id = await store.saveRecording({ name: 'teste', sampleRate: 48000, pcm, kind: 'retrato' });
  const back = await store.getRecordingPcm(id);
  assert.equal(back.length, 4800);
  assert.ok(Math.abs(back[100] - pcm[100]) < 1e-4);
  assert.equal((await store.listRecordings())[0].name, 'teste');
});

test('backup: exporta, apaga, importa e migra esquema antigo', async () => {
  await store.prefs.set('solfege', false);
  const dump = JSON.parse(JSON.stringify(await store.exportAll()));
  assert.equal(dump.schema, store.SCHEMA);
  assert.equal(dump.owner, 'Bruno Moura');
  await store.wipeAll();
  assert.equal((await store.events()).length, 0);
  const r = await store.importAll(dump);
  assert.equal(r.events, 2); assert.equal(r.recordings, 1);
  assert.equal(store.prefs.get('solfege'), false);
  const recs = await store.listRecordings();
  const pcm = await store.getRecordingPcm(recs[0].id);
  assert.equal(pcm.length, 4800);
  // backup do esquema 1: sem "projects" e sem "day" nos eventos
  const old = { app: 'sexteto', schema: 1, kv: [], events: [{ id: 1, type: 'breath', ts: Date.UTC(2025, 0, 5, 15), data: { seconds: 12 } }], recordings: [] };
  const m = store.migrateBackup(old);
  assert.equal(m.schema, 2); assert.deepEqual(m.projects, []); assert.match(m.events[0].day, /^2025-01-0[45]$/);
  assert.throws(() => store.migrateBackup({ app: 'outro' }));
  assert.throws(() => store.migrateBackup({ app: 'sexteto', schema: 99 }));
});

test('sem IndexedDB: alternativa em memória funciona', async () => {
  const saved = globalThis.indexedDB; delete globalThis.indexedDB; store._reset();
  await store.kv.set('x', 1); assert.equal(await store.kv.get('x'), 1);
  await store.log('breath', { seconds: 3 }); assert.equal((await store.events('breath')).length, 1);
  globalThis.indexedDB = saved; store._reset();
});
