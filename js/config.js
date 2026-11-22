// Site configuration loading. No rendering or game logic here.
//
// The game reads dungeon.json from the directory the page was loaded from and
// falls back to example.dungeon.json when that file is missing. Every path in a
// JSON file is relative to the file that contains it.

/** Resolve `path` against the URL of the file that mentioned it. */
export function resolve(path, fromUrl) {
  return new URL(path, fromUrl).href;
}

/** Fetch and parse a JSON file; throws an Error naming the URL on failure. */
export async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url, { cache: 'no-cache' });
  } catch (cause) {
    throw new Error(`Could not fetch ${url}`, { cause });
  }
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  try {
    return await response.json();
  } catch (cause) {
    throw new Error(`${url}: not valid JSON (${cause.message})`, { cause });
  }
}

/**
 * Load the site configuration.
 * @returns {Promise<{config: object, url: string, usedExample: boolean}>}
 */
export async function loadConfig(baseUrl = document.baseURI) {
  const primary = resolve('dungeon.json', baseUrl);
  try {
    return { config: await fetchJson(primary), url: primary, usedExample: false };
  } catch (primaryError) {
    const fallback = resolve('example.dungeon.json', baseUrl);
    try {
      return { config: await fetchJson(fallback), url: fallback, usedExample: true };
    } catch (fallbackError) {
      throw new Error(
        `No site configuration found. Tried dungeon.json (${primaryError.message}) ` +
        `and example.dungeon.json (${fallbackError.message}).`);
    }
  }
}
