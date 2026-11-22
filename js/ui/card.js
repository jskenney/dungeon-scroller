// Character cards: the card image with the game's lettering drawn into its
// reserved text area, and a small animated sprite preview.

import { h } from './dom.js';

const FLIGHT_TEXT = { none: 'Cannot fly', mp: 'Flies using MP', free: 'Flies freely' };

/** One-line summary of an ability from its catalog values. */
export function describeAbility(a) {
  const parts = [];
  if (a.type === 'heal') parts.push(`heals ${a.amount}`);
  else if (a.damage) parts.push(`${a.damage} damage`);
  const e = a.effect ?? {};
  if (e.stun) parts.push('stuns');
  if (e.slow) parts.push('slows');
  if (e.knockback) parts.push('pushes back');
  if (e.damageTaken) parts.push(`target takes +${Math.round((e.damageTaken - 1) * 100)}% damage`);
  if (a.projectile?.pierce) parts.push('passes through');
  if (a.type === 'projectile' || a.type === 'target') parts.push('ranged');
  parts.push(a.mp ? `${a.mp} MP` : 'no MP');
  return parts.join(' · ');
}

/**
 * Build a card element for a hero.
 * @param {object} card    loaded card JSON (with imageUrl)
 * @param {object} entity  sheet entity with `gameplay`
 */
export function cardElement(card, entity) {
  const g = entity.gameplay;
  const pct = (v, total) => `${(v / total) * 100}%`;
  const a = card.textArea;
  const text = h('div', { class: `card-text ${card.textTone === 'dark' ? 'dark' : 'light'}` },
    h('div', { class: 'card-name' }, entity.name),
    h('div', { class: 'card-role' }, g.role),
    h('div', { class: 'card-blurb' }, g.blurb),
    h('div', { class: 'card-stats' },
      h('span', {}, h('b', {}, 'HP '), g.stats.hp), h('span', {}, h('b', {}, 'MP '), g.stats.mp),
      h('span', {}, FLIGHT_TEXT[g.flight?.mode ?? 'none'])),
    h('ul', { class: 'card-abilities' }, Object.entries(g.abilities).map(([slot, ability]) =>
      h('li', {}, h('b', {}, entity.animations[slot]?.label ?? slot), h('span', {}, describeAbility(ability))))));
  return h('div', { class: 'card' },
    h('img', { src: card.imageUrl, alt: '', draggable: 'false' }),
    h('div', { class: 'card-area', style: {
      left: pct(a.x, card.size.w), top: pct(a.y, card.size.h), width: pct(a.w, card.size.w), height: pct(a.h, card.size.h),
    } }, text));
}

/** A card with a title and a few lines of text written into its text area (used for NPCs). */
export function plainCard(card, title, subtitle, text) {
  const pct = (v, total) => `${(v / total) * 100}%`;
  const a = card.textArea;
  return h('div', { class: 'card' },
    h('img', { src: card.imageUrl, alt: '', draggable: 'false' }),
    h('div', { class: 'card-area', style: {
      left: pct(a.x, card.size.w), top: pct(a.y, card.size.h), width: pct(a.w, card.size.w), height: pct(a.h, card.size.h),
    } }, h('div', { class: `card-text ${card.textTone === 'dark' ? 'dark' : 'light'}` },
      h('div', { class: 'card-name' }, title),
      h('div', { class: 'card-role' }, subtitle),
      h('div', { class: 'card-blurb' }, text))));
}

/**
 * A looping preview of one animation, drawn straight from the sheet image.
 * Stops by itself once the element leaves the page.
 */
export function spritePreview(entity, slot = 'idle', scale = 2, crop = false) {
  const sheet = entity.sheet, clip = entity.animations[slot];
  const { w, h: ch } = sheet.cell;
  const el = h('div', { class: 'sprite-preview', 'aria-hidden': 'true', style: {
    width: `${w * scale}px`, height: `${ch * scale}px`,
    backgroundImage: `url("${sheet.imageUrl}")`,
    backgroundSize: `${sheet.size.w * scale}px ${sheet.size.h * scale}px`,
  } });
  const total = clip.durations.reduce((a, b) => a + b, 0);
  const start = performance.now();
  let started = false;
  const tick = now => {
    if (!el.isConnected) { if (started) return; } else started = true;
    let t = (now - start) % total, frame = 0;
    while (t >= clip.durations[frame]) t -= clip.durations[frame++];
    const [dx, dy] = clip.offsets?.[frame] ?? [0, 0];
    el.style.backgroundPosition = `${-frame * w * scale}px ${-(clip.row - 1) * ch * scale}px`;
    el.style.transform = `translate(${dx * scale}px, ${dy * scale}px)${sheet.facing === 'left' ? ' scaleX(-1)' : ''}`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  if (crop && entity.idleBounds) {
    // Show just the character, not the whole empty cell.
    const b = entity.idleBounds, pad = 6;
    el.style.position = 'absolute';
    el.style.left = `${-(sheet.facing === 'left' ? w - b.x - b.w - pad : b.x - pad) * scale}px`;
    el.style.top = `${-(b.y - pad) * scale}px`;
    return h('div', { class: 'sprite-crop', style: {
      width: `${(b.w + pad * 2) * scale}px`, height: `${(b.h + pad * 2) * scale}px` } }, el);
  }
  return el;
}
