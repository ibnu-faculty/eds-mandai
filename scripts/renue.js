/*
 * Re:Nue shared runtime.
 *
 * The Re:Nue blocks were ported from a standalone EDS project whose
 * scripts/aem.js exposed two helpers this project's aem.js does not:
 * `optimizePicture()` (rewrites an existing <picture>) and a `loadFragment()`
 * that can skip block decoration. Rather than patch aem.js — which must stay
 * untouched, see AGENTS.md — both live here, alongside the theme loader that
 * pulls in the Re:Nue design tokens on demand.
 *
 * Nothing in this file is used by Mandai's own blocks.
 */
import { loadCSS } from './aem.js';

/**
 * Loads the Re:Nue design tokens and webfonts.
 *
 * The tokens are kept out of styles/styles.css so the two brands stay
 * separate: a page with no Re:Nue block on it never pays for them. loadCSS()
 * de-duplicates by href, so every block can call this unconditionally.
 * @returns {Promise} resolves once both stylesheets have loaded
 */
export function loadRenueTheme() {
  const base = window.hlx.codeBasePath;
  return Promise.all([loadCSS(`${base}/styles/renue-fonts.css`), loadCSS(`${base}/styles/renue-styles.css`)]);
}

/**
 * Rewrites an authored <picture> in place with a responsive, format-optimized
 * source set. Unlike aem.js's createOptimizedPicture() — which builds a new
 * element from a src string — this preserves the original element, and with it
 * the data-aue-* instrumentation Universal Editor attaches for click-to-edit.
 * @param {Element} picture The picture element to rewrite
 * @param {Object} [opts] Options
 * @param {Array} [opts.breakpoints] Breakpoints as `{ media, width }` pairs
 * @param {boolean} [opts.eager] Whether to load the fallback image eagerly
 * @returns {Element} The same picture element
 */
export function optimizePicture(picture, opts = {}) {
  if (!picture || picture.tagName !== 'PICTURE') return picture;
  const img = picture.querySelector('img');
  if (!img || !img.src) return picture;

  const { breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }], eager = false } = opts;

  const url = img.src.startsWith('http') ? new URL(img.src) : new URL(img.src, window.location.href);
  const { origin, pathname } = url;
  const ext = pathname.split('.').pop();

  picture.querySelectorAll('source').forEach((s) => s.remove());

  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${origin}${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.insertBefore(source, img);
  });

  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${origin}${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.insertBefore(source, img);
    } else {
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('src', `${origin}${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
    }
  });

  return picture;
}

/**
 * Fetches a fragment's plain HTML.
 *
 * The Re:Nue header and footer point at Experience Fragments whose markup is
 * hand-styled layout, not authored blocks, so they need to opt out of the
 * decoration pass that blocks/fragment/fragment.js always applies. Callers
 * that do want decoration should use that module instead.
 * @param {string} path The path to the fragment
 * @returns {Promise<HTMLElement|null>} A container holding the fragment, or
 * null if the path was invalid or the fetch failed
 */
export async function loadPlainFragment(path) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null;

  let resp;
  try {
    resp = await fetch(`${path.replace(/(\.plain)?\.html$/, '')}.plain.html`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[renue] network error fetching "${path}.plain.html"`, err);
    return null;
  }
  if (!resp.ok) {
    // eslint-disable-next-line no-console
    console.error(`[renue] "${path}.plain.html" returned ${resp.status}`);
    return null;
  }

  const container = document.createElement('div');
  container.innerHTML = await resp.text();

  // rebase fragment-relative media references onto the fragment's own path
  const rebase = (tag, attr) => {
    container.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((el) => {
      el[attr] = new URL(el.getAttribute(attr), new URL(path, window.location)).href;
    });
  };
  rebase('img', 'src');
  rebase('source', 'srcset');

  return container;
}
