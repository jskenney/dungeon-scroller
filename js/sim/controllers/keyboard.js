// Turns the keyboard state into the intents the simulation understands.

/**
 * @param {import('../../input.js').Input} input
 * @param {boolean} withPresses  false for the 2nd and later steps of a frame, so a
 *                               single key press is not acted on more than once
 */
export function keyboardIntents(input, withPresses) {
  const p = action => withPresses && input.pressed(action);
  return {
    dir: (input.held('right') ? 1 : 0) - (input.held('left') ? 1 : 0),
    vertical: (input.held('down') ? 1 : 0) - (input.held('up') ? 1 : 0),
    run: input.held('run'),
    jumpHeld: input.held('jump'),
    jumpPressed: p('jump'),
    down: input.held('down'),
    attack1: p('attack1'), attack2: p('attack2'), attack3: p('attack3'),
    teleport: p('teleport'), fly: p('fly'), interact: p('interact'),
  };
}
