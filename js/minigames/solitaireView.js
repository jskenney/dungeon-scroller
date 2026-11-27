// The solitaire table: draws a Solitaire game with cards assembled from one of
// the playing-card atlases, and turns clicks, drags and keys into moves.

import { h } from '../ui/dom.js';
import { Solitaire, RANK_NAMES, SUITS } from './solitaire.js';

const faces = new Map();           // atlas id -> { back, blank, cards: {'heart-12': url} }

/** Draw one sprite cell of an atlas onto a canvas context. */
function cell(ctx, atlas, sprite, dx = 0, dy = 0) {
  const { w, h: ch } = atlas.cell;
  ctx.drawImage(atlas.source.resource, (sprite.col - 1) * w, (sprite.row - 1) * ch, w, ch, dx, dy, w, ch);
}

/** Stamp a suit symbol centred on a point, upside down if asked. */
function stamp(ctx, atlas, suit, x, y, size, turned = false) {
  const s = atlas.sprites[suit], c = s.crop, { w, h: ch } = atlas.cell;
  ctx.save();
  ctx.translate(x, y);
  if (turned) ctx.rotate(Math.PI);
  ctx.drawImage(atlas.source.resource, (s.col - 1) * w + c.x, (s.row - 1) * ch + c.y, c.w, c.h, -size / 2, -size / 2, size, size);
  ctx.restore();
}

/** One finished card face, put together the way the atlas JSON lays it out. */
function drawFace(atlas, rank, suit) {
  const L = atlas.layouts, { w, h: ch } = atlas.cell, name = RANK_NAMES[rank];
  const canvas = Object.assign(document.createElement('canvas'), { width: w, height: ch });
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const template = L.recipes[name] ?? (rank === 1 ? L.recipes.A : L.recipes['2-10']);
  cell(ctx, atlas, atlas.sprites[template]);
  for (const [x, y] of L.pips.centers[name] ?? []) stamp(ctx, atlas, suit, x, y, rank === 1 ? L.pips.aceSize : L.pips.size, y > atlas.pivot.y);
  // The rank and a small suit in the upper-left corner, and the same turned round in the lower right.
  const index = () => {
    const r = L.index.rank, s = L.index.suit;
    ctx.fillStyle = atlas.sprites[suit].color;
    ctx.font = `700 ${name.length > 1 ? 19 : 22}px Georgia, "Times New Roman", serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(name, r.x + r.w / 2, r.y + r.h / 2 + 1, r.w);
    stamp(ctx, atlas, suit, s.x + s.w / 2, s.y + s.h / 2, s.w);
  };
  index();
  ctx.save();
  ctx.translate(w, ch); ctx.rotate(Math.PI);
  index();
  ctx.restore();
  return canvas.toDataURL();
}

/** All 52 faces, the back and an empty-pile outline for a deck. Made once per deck. */
function facesFor(atlas) {
  if (faces.has(atlas.id)) return faces.get(atlas.id);
  const { w, h: ch } = atlas.cell, cards = {};
  for (const suit of SUITS) for (let rank = 1; rank <= 13; rank++) cards[`${suit}-${rank}`] = drawFace(atlas, rank, suit);
  const canvas = Object.assign(document.createElement('canvas'), { width: w, height: ch });
  cell(canvas.getContext('2d'), atlas, atlas.sprites[atlas.layouts.recipes.faceDown]);
  const made = { cards, back: canvas.toDataURL() };
  faces.set(atlas.id, made);
  return made;
}

const SUIT_NAMES = { heart: 'hearts', diamond: 'diamonds', spade: 'spades', club: 'clubs' };
const cardName = card => `${{ 1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King' }[card.rank] ?? card.rank} of ${SUIT_NAMES[card.suit]}`;

/**
 * Build the solitaire screen.
 * @param {object} o
 * @param {object[]} o.decks      the card atlases that can be played with
 * @param {string} [o.deck]       id of the deck to start with
 * @param {(deckId: string) => void} [o.onDeck]   the player chose another deck
 * @param {() => string} o.onWin  called once per game won; returns a line saying what was gained
 * @param {() => void} [o.onLeave]  leave the table; without it there is no way out to offer (the game on a page of its own)
 * @param {(cue: string) => void} [o.sound]
 * @returns {{element: HTMLElement, key: (code: string) => boolean}}
 */
export function solitaireScreen({ decks, deck, onDeck, onWin, onLeave, sound = () => {} }) {
  let atlas = decks.find(d => d.deck === deck || d.id === deck) ?? decks[0];
  let art = facesFor(atlas);
  const game = new Solitaire();
  let rewarded = false, reward = '', finishing = null;

  const status = h('p', { class: 'sol-status', role: 'status' });
  const board = h('div', { class: 'sol-board' });
  const undo = h('button', { type: 'button', onclick: () => { if (game.undo()) { sound('ui'); render(); } } }, 'Undo');
  const finish = h('button', { type: 'button', class: 'primary', onclick: () => finishOff() }, 'Finish');
  const fresh = () => { clearInterval(finishing); finishing = null; game.deal(); rewarded = false; reward = ''; say(''); render(); };
  const deckChoice = decks.length > 1 ? h('label', { class: 'sol-deck' }, 'Cards ',
    h('select', { onchange: e => { atlas = decks.find(d => d.id === e.target.value); art = facesFor(atlas); onDeck?.(atlas.deck ?? atlas.id); render(); } },
      decks.map(d => h('option', { value: d.id, selected: d === atlas }, d.name ?? d.id)))) : null;
  const counts = h('span', { class: 'muted' });
  const element = h('div', { class: 'screen solitaire' },
    h('header', { class: 'sol-bar' },
      h('h1', {}, 'Solitaire'), counts,
      h('span', { class: 'sol-buttons' }, deckChoice, undo, finish,
        h('button', { type: 'button', onclick: fresh }, 'New game'),
        onLeave ? h('button', { type: 'button', onclick: () => { clearInterval(finishing); onLeave(); } }, 'Back to the game') : null)),
    board, status,
    h('p', { class: 'muted small sol-help' }, `Click a card to send it where it fits, or drag it. Click the stock to draw. Keys: D draw, U undo, N new game${onLeave ? ', Esc leave' : ''}.`));

  function say(text) { status.textContent = text; }

  function afterMove(moved) {
    if (!moved) { sound('locked'); return; }
    sound('ui');
    if (game.won && !rewarded) {
      rewarded = true;
      reward = onWin() ?? '';
      sound('complete');
    }
    render();
  }

  /** Once nothing is hidden, play the remaining cards up to the foundations one at a time. */
  function finishOff() {
    if (finishing || !game.canFinish) return;
    finishing = setInterval(() => {
      if (!element.isConnected || !game.finishStep()) { clearInterval(finishing); finishing = null; }
      afterMove(true);
    }, 90);
  }

  // ---- dragging: the card under the pointer and everything on top of it follow the pointer
  let drag = null;
  function startDrag(e, from, at, button) {
    if (e.button !== 0) return;
    drag = { from, at, button, x: e.clientX, y: e.clientY, ghost: null, moved: false };
    button.setPointerCapture(e.pointerId);
  }
  function moveDrag(e) {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      // Lift the dragged cards out of their column into a layer that follows the pointer.
      const pile = drag.button.parentElement, picked = [...pile.children].slice([...pile.children].indexOf(drag.button));
      const box = drag.button.getBoundingClientRect(), top = parseFloat(drag.button.style.top) || 0;
      drag.ghost = h('div', { class: 'sol-ghost', style: { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` } });
      for (const el of picked) {
        const copy = el.cloneNode(true);
        copy.style.top = `${(parseFloat(el.style.top) || 0) - top}%`;
        drag.ghost.append(copy);
        el.style.visibility = 'hidden';
      }
      element.append(drag.ghost);
    }
    drag.ghost.style.transform = `translate(${dx}px, ${dy}px)`;
  }
  function endDrag(e) {
    if (!drag) return;
    const { from, at, moved, ghost } = drag;
    drag = null;
    if (!moved) return;                              // an ordinary click: the click handler deals with it
    ghost.remove();
    const under = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-pile]');
    const to = under && { pile: under.dataset.pile, index: Number(under.dataset.index) };
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    if (to && game.move(from, at, to)) afterMove(true); else render();
  }
  let suppressClick = false;

  function cardButton(card, from, at, top, movable) {
    const label = card.up ? cardName(card) : 'face-down card';
    const button = h('button', { type: 'button', class: `pc${card.up ? '' : ' down'}`, 'aria-label': label, title: card.up ? label : '',
      tabindex: movable ? 0 : -1, style: { top: `${top}%`, backgroundImage: `url(${card.up ? art.cards[`${card.suit}-${card.rank}`] : art.back})` } });
    if (movable) {
      button.addEventListener('click', () => { if (!suppressClick) afterMove(Boolean(game.autoMove(from, at))); });
      button.addEventListener('pointerdown', e => startDrag(e, from, at, button));
      button.addEventListener('pointermove', moveDrag);
      button.addEventListener('pointerup', endDrag);
      button.addEventListener('pointercancel', () => { if (drag?.ghost) drag.ghost.remove(); drag = null; render(); });
    }
    return button;
  }

  function render() {
    const pile = (name, index, ...children) => h('div', { class: `sol-pile ${name}`, 'data-pile': name, 'data-index': index }, ...children);
    const stockTop = game.stock.length
      ? h('button', { type: 'button', class: 'pc down', 'aria-label': `Stock, ${game.stock.length} cards. Draw a card`, style: { backgroundImage: `url(${art.back})` } })
      : h('button', { type: 'button', class: 'pc empty', 'aria-label': game.waste.length ? 'Stock is empty. Turn the waste back over' : 'Stock is empty', disabled: !game.waste.length }, game.waste.length ? '↻' : '');
    stockTop.addEventListener('click', () => { const did = game.draw(); if (did) { sound('ui'); render(); } });
    const waste = game.waste.slice(-1).map(card => cardButton(card, { pile: 'waste' }, game.waste.length - 1, 0, true));
    const foundations = game.foundations.map((cards, i) => pile('foundation', i,
      ...cards.slice(-1).map(card => cardButton(card, { pile: 'foundation', index: i }, cards.length - 1, 0, true))));
    const columns = game.tableau.map((cards, i) => {
      // Face-down cards overlap more than face-up ones; long columns close up so they stay on screen.
      const tight = cards.length > 12 ? 12 / cards.length : 1;
      let top = 0;
      const buttons = cards.map((card, at) => {
        const b = cardButton(card, { pile: 'tableau', index: i }, at, top, card.up);
        top += (card.up ? 24 : 9) * tight;
        return b;
      });
      const column = pile('tableau', i, ...buttons);
      column.style.setProperty('--fan', `${top}%`);
      return column;
    });
    board.replaceChildren(
      h('div', { class: 'sol-top' }, pile('stock', 0, stockTop), pile('waste', 0, ...waste), h('div', {}), ...foundations),
      h('div', { class: 'sol-columns' }, ...columns));
    undo.disabled = !game.history.length || game.won;
    finish.hidden = !game.canFinish || Boolean(finishing);
    const home = game.foundations.reduce((n, p) => n + p.length, 0);
    counts.textContent = `${game.moves} move${game.moves === 1 ? '' : 's'} · ${home} of 52 home`;
    if (game.won) say(`You won in ${game.moves} moves. ${reward}`.trim());
    else if (game.canFinish && !finishing) say('Every card is face up. Press Finish to play the rest.');
  }

  /** Keys while the table is open. @returns whether the key was used */
  function key(code) {
    if (code === 'KeyD') { if (game.draw()) { sound('ui'); render(); } return true; }
    if (code === 'KeyU') { undo.click(); return true; }
    if (code === 'KeyN') { fresh(); return true; }
    if (code === 'KeyF' && game.canFinish) { finishOff(); return true; }
    return false;
  }

  render();
  return { element, key };
}
