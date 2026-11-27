// Klondike solitaire, the classic game: draw one card at a time, and go through
// the stock as many times as you like. Rules only: no drawing, no browser APIs.
//
// Piles are named { pile: 'stock' | 'waste' | 'foundation' | 'tableau', index }.
// A card is { rank: 1–13 (ace is 1), suit: 'heart' | 'diamond' | 'spade' | 'club', up: boolean }.

export const SUITS = ['heart', 'diamond', 'spade', 'club'];
export const RANK_NAMES = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const isRed = card => card.suit === 'heart' || card.suit === 'diamond';

export class Solitaire {
  /** @param {() => number} [random]  a source of numbers from 0 up to 1, for the shuffle */
  constructor(random = Math.random) {
    this.random = random;
    this.deal();
  }

  /** Shuffle and lay out a new game: seven columns of one to seven cards, the last of each face up. */
  deal() {
    const deck = [];
    for (const suit of SUITS) for (let rank = 1; rank <= 13; rank++) deck.push({ rank, suit, up: false });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    this.tableau = [];
    for (let column = 0; column < 7; column++) {
      const pile = deck.splice(0, column + 1);
      pile[pile.length - 1].up = true;
      this.tableau.push(pile);
    }
    this.stock = deck;                 // the last card is the top
    this.waste = [];
    this.foundations = [[], [], [], []];
    this.moves = 0;
    this.passes = 0;                   // times the waste has been turned back over
    this.history = [];
    return this;
  }

  get won() { return this.foundations.every(pile => pile.length === 13); }

  /** Every card is face up and none are left to draw: the rest can only go one way. */
  get canFinish() {
    return !this.won && !this.stock.length && !this.waste.length && this.tableau.every(pile => pile.every(card => card.up));
  }

  cards(where) {
    if (where.pile === 'stock') return this.stock;
    if (where.pile === 'waste') return this.waste;
    return (where.pile === 'foundation' ? this.foundations : this.tableau)[where.index];
  }

  remember() {
    this.history.push(JSON.stringify([this.stock, this.waste, this.foundations, this.tableau, this.moves, this.passes]));
    if (this.history.length > 500) this.history.shift();
  }

  /** Take back the last move. @returns {boolean} whether there was one */
  undo() {
    const last = this.history.pop();
    if (!last) return false;
    [this.stock, this.waste, this.foundations, this.tableau, this.moves, this.passes] = JSON.parse(last);
    return true;
  }

  /**
   * Turn the next card from the stock onto the waste. With the stock empty,
   * the waste is turned back over to become the stock again, in the same order.
   * @returns {'drew' | 'turned' | null}
   */
  draw() {
    if (!this.stock.length && !this.waste.length) return null;
    this.remember();
    this.moves++;
    if (this.stock.length) {
      const card = this.stock.pop();
      card.up = true;
      this.waste.push(card);
      return 'drew';
    }
    this.stock = this.waste.reverse().map(card => ({ ...card, up: false }));
    this.waste = [];
    this.passes++;
    return 'turned';
  }

  /** Can this card be the next one on a foundation pile? Aces start one; then the same suit, one higher. */
  fitsFoundation(card, index) {
    const pile = this.foundations[index], top = pile[pile.length - 1];
    return top ? top.suit === card.suit && card.rank === top.rank + 1 : card.rank === 1;
  }

  /** Can this card go on a column? Kings on an empty one; otherwise the other colour, one lower. */
  fitsTableau(card, index) {
    const pile = this.tableau[index], top = pile[pile.length - 1];
    return top ? top.up && isRed(top) !== isRed(card) && card.rank === top.rank - 1 : card.rank === 13;
  }

  /**
   * May the cards from position `at` to the top of pile `from` go to pile `to`?
   * Only the top card of the waste or of a foundation can move; from a column,
   * any face-up card moves with everything on top of it.
   */
  canMove(from, at, to) {
    const source = this.cards(from), card = source?.[at];
    if (!card || !card.up || from.pile === 'stock' || to.pile === 'stock' || to.pile === 'waste') return false;
    if (from.pile === to.pile && from.index === to.index) return false;
    const count = source.length - at;
    if (from.pile !== 'tableau' && count !== 1) return false;
    if (to.pile === 'foundation') return count === 1 && this.fitsFoundation(card, to.index);
    return this.fitsTableau(card, to.index);
  }

  /** Make a move if it is allowed. The card it uncovers in a column is turned face up. */
  move(from, at, to) {
    if (!this.canMove(from, at, to)) return false;
    this.remember();
    const source = this.cards(from);
    this.cards(to).push(...source.splice(at));
    const uncovered = source[source.length - 1];
    if (from.pile === 'tableau' && uncovered) uncovered.up = true;
    this.moves++;
    return true;
  }

  /**
   * Where a card would most sensibly go: a foundation if it fits, otherwise a
   * column, preferring one with cards on it. A king is not shuffled from one
   * empty column to another.
   * @returns {{pile: string, index: number} | null}
   */
  bestTarget(from, at) {
    const source = this.cards(from), card = source?.[at];
    if (!card?.up) return null;
    if (at === source.length - 1 && from.pile !== 'foundation') {
      for (let i = 0; i < 4; i++) if (this.canMove(from, at, { pile: 'foundation', index: i })) return { pile: 'foundation', index: i };
    }
    let empty = null;
    for (let i = 0; i < 7; i++) {
      const to = { pile: 'tableau', index: i };
      if (!this.canMove(from, at, to)) continue;
      if (this.tableau[i].length) return to;
      if (!(from.pile === 'tableau' && at === 0)) empty ??= to;
    }
    return empty;
  }

  /** Move a card to wherever bestTarget says. @returns the pile it went to, or null */
  autoMove(from, at) {
    const to = this.bestTarget(from, at);
    return to && this.move(from, at, to) ? to : null;
  }

  /** One step of finishing off a game that can no longer be lost: the lowest card that fits a foundation. */
  finishStep() {
    for (let i = 0; i < 7; i++) {
      const pile = this.tableau[i];
      if (!pile.length) continue;
      for (let f = 0; f < 4; f++) {
        if (this.move({ pile: 'tableau', index: i }, pile.length - 1, { pile: 'foundation', index: f })) return true;
      }
    }
    return false;
  }
}
