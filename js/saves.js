// Saved games kept in this browser: a fixed number of slots, each holding where
// a level had got to. Quick save writes to the slot used most recently.

const STORAGE_KEY = 'dungeon-scroller.saves';
export const SLOTS = 5;

function read() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored && Array.isArray(stored.slots)) return stored;
  } catch { /* nothing usable stored */ }
  return { slots: [], last: null };
}
function write(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; } catch { return false; }
}

/** All slots in order; an empty one is null. */
export function listSaves() {
  const { slots } = read();
  return Array.from({ length: SLOTS }, (_, i) => slots[i] ?? null);
}

/** The slot quick save and quick load use: the one saved or loaded last, else the first empty one, else the first. */
export function quickSlot() {
  const { last } = read(), saves = listSaves();
  if (Number.isInteger(last) && last >= 0 && last < SLOTS) return last;
  const empty = saves.findIndex(s => !s);
  return empty >= 0 ? empty : 0;
}

/** The slot holding the newest save, or -1 when there are none. */
export function newestSlot() {
  let best = -1;
  listSaves().forEach((s, i) => { if (s && (best < 0 || s.when > listSaves()[best].when)) best = i; });
  return best;
}

/** @returns {boolean} whether it could be stored */
export function writeSave(slot, save) {
  const data = read();
  data.slots = listSaves();
  data.slots[slot] = save;
  data.last = slot;
  return write(data);
}

export function readSave(slot) {
  const save = listSaves()[slot];
  if (save) { const data = read(); data.last = slot; write(data); }
  return save;
}

export function deleteSave(slot) {
  const data = read();
  data.slots = listSaves();
  data.slots[slot] = null;
  if (data.last === slot) data.last = null;
  write(data);
}
