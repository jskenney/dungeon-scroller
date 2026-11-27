// Progress kept in this browser between levels: each hero's gold and the
// permanent upgrades bought from merchants, and lasting gains won in mini-games.

const STORAGE_KEY = 'dungeon-scroller.profile';

function read() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? { heroes: {} }; } catch { return { heroes: {} }; }
}

/** A hero's saved progress: {gold, upgrades, bonus}. */
export function loadProgress(heroId) {
  const saved = read().heroes?.[heroId];
  return { gold: saved?.gold ?? 0, upgrades: { ...saved?.upgrades }, bonus: { ...saved?.bonus } };
}

export function saveProgress(heroId, hero) {
  const profile = read();
  profile.heroes = { ...profile.heroes, [heroId]: { gold: hero.gold, upgrades: { ...hero.upgrades }, bonus: { ...hero.bonus } } };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch { /* storage unavailable */ }
}

export function resetProgress() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
