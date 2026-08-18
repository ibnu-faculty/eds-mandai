/*
 * Tokio Marine Asia shared runtime.
 *
 * Self-contained on purpose: the TMA blocks must not depend on scripts/renue.js
 * or on Mandai's own helpers, so the three brands in this repo can be changed
 * independently without one breaking another. That costs a small amount of
 * duplication (optimizePicture) and buys total isolation.
 *
 * Nothing in this file is used by Mandai's or Re:Nue's blocks.
 */
import { loadCSS } from './aem.js';

/**
 * Loads the TMA design tokens and webfonts.
 *
 * The tokens are kept out of styles/styles.css so the brands stay separate: a
 * page with no TMA block on it never pays for them. loadCSS() de-duplicates by
 * href, so every block can call this unconditionally.
 * @returns {Promise} resolves once both stylesheets have loaded
 */
export function loadTmaTheme() {
  const base = window.hlx.codeBasePath;
  return Promise.all([
    loadCSS(`${base}/styles/tma-fonts.css`),
    loadCSS(`${base}/styles/tma-styles.css`),
  ]);
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

  const {
    breakpoints = [{ media: '(min-width: 900px)', width: '1920' }, { width: '750' }],
    eager = false,
  } = opts;

  const url = img.src.startsWith('http')
    ? new URL(img.src)
    : new URL(img.src, window.location.href);
  const { origin, pathname } = url;
  const ext = pathname.split('.').pop().toLowerCase();

  /*
   * SVG is resolution-independent and the delivery pipeline does not rasterize
   * it, so a ?width=&format=svg query buys nothing and risks a miss. Leave the
   * element alone apart from the loading hint.
   */
  if (ext === 'svg') {
    img.setAttribute('loading', eager ? 'eager' : 'lazy');
    return picture;
  }

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
 * Reads the trimmed text of a block cell.
 * @param {Element} cell The cell to read
 * @returns {string} The cell's text, or '' when the cell is absent
 */
export function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

/**
 * Turns an authored cell holding an anchor into a styled TMA button.
 *
 * The models pair a link field with a label field in a collapsible group, so
 * the cell arrives as a single anchor whose text is already the button label.
 * @param {Element} cell The cell holding the anchor
 * @param {string} [variant] 'primary' or 'secondary'
 * @returns {Element|null} The styled anchor, or null when nothing was authored
 */
export function buildButton(cell, variant = 'primary') {
  const link = cell?.querySelector('a');
  if (!link || !link.textContent.trim()) return null;
  link.className = `tma-btn tma-btn--${variant}`;
  return link;
}

/**
 * Builds the rounded icon tile used by product groups and assistance cards.
 *
 * Accepts whatever the author supplied — an uploaded image, or an inline SVG
 * dropped in via the icon syntax — and falls back to an empty tinted tile so a
 * missing icon degrades to a neutral shape rather than a broken image.
 *
 * The size comes from a modifier CLASS, not an inline width/height. Inline
 * styles win over any stylesheet, so a px size set here would pin the tile while
 * the fluid type and spacing around it kept scaling — the tiles would visibly
 * shrink relative to their own labels on a wide screen.
 * @param {Element} cell The cell holding the icon
 * @param {string} size 'sm' (the 40px pill tile) or 'md' (the 56px header tile)
 * @returns {Element} The tile element
 */
export function buildIconTile(cell, size = 'md') {
  const tile = document.createElement('span');
  tile.className = `tma-icon-tile tma-icon-tile--${size}`;

  const media = cell?.querySelector('picture, img, svg, .icon');
  if (media) {
    if (media.tagName === 'PICTURE') optimizePicture(media);
    tile.append(media);
  }
  return tile;
}
