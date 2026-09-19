// HTTP and the desktop sneakers:// protocol can fetch the JSON manifest. A
// browser opened directly on editor.html with file:// cannot, so keep the
// exact same generated manifest available as a local module fallback.
export function lowMemoryDevice() {
  const memory = Number(globalThis.navigator?.deviceMemory || 0);
  const connection = globalThis.navigator?.connection;
  const narrow = typeof globalThis.matchMedia === 'function' && matchMedia('(max-width: 700px)').matches;
  return (memory > 0 && memory <= 2) || connection?.saveData === true || narrow;
}

export function compactSprites(sprites) {
  return Object.fromEntries(Object.entries(sprites).map(([name, frames]) => [name, frames.map(frame => ({
    ...frame,
    // Only texture coordinates shrink. World dimensions and ground pivots
    // must still match the same collision geometry on every device.
    rect: frame.rect.map(value => Math.round(value / 2)),
  }))]));
}

export function chooseManifest(data) {
  const lowMemory = lowMemoryDevice();
  // The growing desktop atlas exceeded 73 million decoded pixels. Sampling
  // it repeatedly stalls canvas even on a fast desktop. Use the already
  // authored 1x delivery texture when the 2x sheet exceeds our texture budget;
  // canvas resolution and all world-space dimensions remain unchanged.
  const oversized = data.size[0] > 8192 || data.size[1] > 8192 || data.size[0] * data.size[1] > 24_000_000;
  const compact = (lowMemory || oversized) && data.lowMemory;
  if (!compact) return {...data, lowMemoryActive: lowMemory, compactAtlasActive: false};
  return {...data, ...compact, sprites: compactSprites(data.sprites), lowMemoryActive: lowMemory, compactAtlasActive: true};
}

export async function loadRuntimeManifest() {
  if (typeof location !== 'undefined' && location.protocol === 'file:') {
    if (globalThis.__SNEAKERS_RUNTIME_MANIFEST__) return chooseManifest(globalThis.__SNEAKERS_RUNTIME_MANIFEST__);
    const module = await import('./runtime-manifest.js?v=7');
    return chooseManifest(module.RUNTIME_MANIFEST);
  }
  // The JSON itself is also revalidated so a CDN cannot serve a new HTML
  // shell with an older atlas manifest.
  const response = await fetch('assets/runtime/sprites.json', { cache: 'default' });
  if (!response.ok) throw new Error('The artwork could not be loaded.');
  return chooseManifest(await response.json());
}
