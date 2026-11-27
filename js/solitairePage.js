// Solitaire on a page of its own: the same table the game opens from the deck
// of cards, without the side-scroller around it. Only the playing-card art is
// loaded. There is nothing to win here but the game.

import { loadConfig } from './config.js';
import { loadAssets } from './assets/loader.js';
import { solitaireScreen } from './minigames/solitaireView.js';

const DECK_KEY = 'dungeon-scroller.solitaire.deck', WINS_KEY = 'dungeon-scroller.solitaire.wins';
const recall = key => { try { return localStorage.getItem(key); } catch { return null; } };
const keep = (key, value) => { try { localStorage.setItem(key, value); } catch { /* storage unavailable */ } };

async function main() {
  const status = document.getElementById('boot-status');
  try {
    const { config, url } = await loadConfig();
    // Everything but the atlases is left out, so sprites, levels and catalogs are not fetched.
    const assets = await loadAssets({ assets: { atlases: config.assets?.atlases ?? [] } }, url);
    const decks = assets.atlases.filter(a => a.layouts?.pips);
    if (!decks.length) throw new Error('no playing-card art is listed in the site configuration');
    const table = solitaireScreen({
      decks, deck: recall(DECK_KEY) ?? 'dungeon',
      onDeck: id => keep(DECK_KEY, id),
      onWin: () => {
        const wins = (Number(recall(WINS_KEY)) || 0) + 1;
        keep(WINS_KEY, wins);
        return `Games won here: ${wins}.`;
      },
    });
    document.getElementById('ui').replaceChildren(table.element);
    window.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
      if (table.key(e.code)) e.preventDefault();
    });
    document.getElementById('boot').remove();
  } catch (error) {
    console.error(error);
    status.textContent = `Could not start: ${error.message}`;
  }
}

main();
