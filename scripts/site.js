/*
 * Shared helpers ported from the AEM frontend `site.js` and the small
 * behavioural plugins (match-height.js, background-change.js, image-mobile.js).
 * The breakpoints are the ones the original site used, so components switch
 * layout at exactly the same widths.
 */

/** Site.isMobile() — screenSize.MOBILE (1023px) */
export const MOBILE_MQ = window.matchMedia('(max-width: 1023px)');
/** Site.isMobileSm() — screenSize.MOBILE_SM (767px) */
export const MOBILE_SM_MQ = window.matchMedia('(max-width: 767px)');
/** the `@screen-md-min` LESS breakpoint used by the grid */
export const TABLET_MQ = window.matchMedia('(max-width: 991px)');

export function isMobile() {
  return MOBILE_MQ.matches;
}

export function isMobileSm() {
  return MOBILE_SM_MQ.matches;
}

export function isDesktop() {
  return !MOBILE_MQ.matches;
}

/**
 * Runs `fn` now and again whenever the media query starts or stops matching.
 * @param {MediaQueryList} mq
 * @param {Function} fn
 */
export function onMediaChange(mq, fn) {
  fn(mq.matches);
  mq.addEventListener('change', (e) => fn(e.matches));
}

/**
 * Debounced window resize listener that only fires when the width changed,
 * matching the `lastWidth` guard used across the original plugins.
 * @param {Function} fn
 * @param {number} delay
 */
export function onWidthChange(fn, delay = 500) {
  let lastWidth = window.innerWidth;
  let timer;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    window.clearTimeout(timer);
    timer = window.setTimeout(fn, delay);
  });
}

/**
 * Runs `fn` once the element has been laid out.
 *
 * Blocks are decorated while their section is still `display: none`, so any
 * measurement taken during `decorate()` reads zero. This waits for the element
 * to have a box before measuring, and re-measures whenever its size changes.
 *
 * @param {Element} element
 * @param {Function} fn
 */
export function whenMeasurable(element, fn) {
  if (element.getBoundingClientRect().height > 0) {
    fn();
    return;
  }
  const observer = new ResizeObserver(() => {
    if (element.getBoundingClientRect().height === 0) return;
    observer.disconnect();
    fn();
  });
  observer.observe(element);
}

/**
 * Equal-height groups — the replacement for jquery.matchHeight used by
 * `data-eq-height`. Every element in a group gets the tallest natural height
 * as its `min-height`.
 * @param {Element[]} elements members of one group
 */
export function matchHeight(elements) {
  const items = [...elements];
  if (items.length < 2) return;

  const apply = () => {
    items.forEach((el) => { el.style.minHeight = ''; });
    const tallest = items.reduce((max, el) => Math.max(max, el.getBoundingClientRect().height), 0);
    if (!tallest) return;
    items.forEach((el) => { el.style.minHeight = `${Math.ceil(tallest)}px`; });
  };

  whenMeasurable(items[0], apply);
  onWidthChange(apply);
  // images change the natural height once they decode
  items.forEach((el) => {
    el.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', apply, { once: true });
    });
  });
}

/**
 * Groups elements by their `data-eq-height` value and equalises each group.
 * @param {Element} scope
 */
export function decorateEqualHeights(scope) {
  const groups = new Map();
  scope.querySelectorAll('[data-eq-height]').forEach((el) => {
    const key = el.getAttribute('data-eq-height');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(el);
  });
  groups.forEach((els) => matchHeight(els));
}

/**
 * background-change.js — swaps a background image at the mobile breakpoint.
 * @param {Element} el
 * @param {string} desktopUrl
 * @param {string} mobileUrl
 */
export function responsiveBackground(el, desktopUrl, mobileUrl) {
  if (!desktopUrl && !mobileUrl) return;
  onMediaChange(MOBILE_MQ, (mobile) => {
    const url = mobile ? (mobileUrl || desktopUrl) : (desktopUrl || mobileUrl);
    if (url) el.style.backgroundImage = `url('${url}')`;
  });
}

/**
 * image-mobile.js — swaps an <img> src at the mobile breakpoint.
 * @param {HTMLImageElement} img
 * @param {string} desktopSrc
 * @param {string} mobileSrc
 */
export function responsiveImage(img, desktopSrc, mobileSrc) {
  if (!desktopSrc && !mobileSrc) return;
  onMediaChange(MOBILE_MQ, (mobile) => {
    const src = mobile ? (mobileSrc || desktopSrc) : (desktopSrc || mobileSrc);
    if (src && img.getAttribute('src') !== src) img.setAttribute('src', src);
  });
}

/**
 * Reads a boolean-ish authored value ("true"/"yes"/"on").
 * @param {string} value
 * @returns {boolean}
 */
export function isTrue(value) {
  return /^(true|yes|on|1)$/i.test((value || '').trim());
}

/* ---------------------------------------------------------------- icons ---- */

const iconCache = new Map();

function fetchIcon(name) {
  if (!iconCache.has(name)) {
    const url = `${window.hlx.codeBasePath}/icons/${name}.svg`;
    iconCache.set(
      name,
      fetch(url)
        .then((response) => (response.ok ? response.text() : ''))
        .catch(() => ''),
    );
  }
  return iconCache.get(name);
}

/**
 * Inlines `<span class="icon icon-name">` placeholders as SVG.
 *
 * The boilerplate `decorateIcons` inserts an `<img>`, which cannot inherit the
 * surrounding text colour; the Mandai design tints the same glyph differently
 * in almost every component, so the markup has to be inline for `currentColor`
 * to work — the icon fonts the AEM site used behaved the same way.
 *
 * @param {Element} element container holding the icon placeholders
 */
export function decorateIcons(element) {
  element.querySelectorAll('span.icon').forEach(async (span) => {
    if (span.dataset.iconStatus) return;
    const name = [...span.classList]
      .map((c) => (c.startsWith('icon-') ? c.slice(5) : null))
      .find(Boolean);
    if (!name) return;

    span.dataset.iconStatus = 'loading';
    const markup = await fetchIcon(name);
    if (!markup) {
      span.dataset.iconStatus = 'missing';
      return;
    }
    const template = document.createElement('template');
    template.innerHTML = markup.trim();
    const svg = template.content.querySelector('svg');
    if (svg) {
      svg.setAttribute('focusable', 'false');
      svg.setAttribute('aria-hidden', 'true');
      span.replaceChildren(svg);
    }
    span.dataset.iconStatus = 'loaded';
  });
}

/**
 * Pauses every `<video>` / YouTube / Vimeo player inside `el`.
 * @param {Element} el
 */
export function pauseMedia(el) {
  el.querySelectorAll('video').forEach((v) => { try { v.pause(); } catch { /* ignore */ } });
  el.querySelectorAll('iframe[src*="youtube"]').forEach((f) => {
    try {
      f.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
        '*',
      );
    } catch { /* ignore */ }
  });
  el.querySelectorAll('iframe[src*="vimeo"]').forEach((f) => {
    try { f.contentWindow.postMessage({ method: 'pause' }, '*'); } catch { /* ignore */ }
  });
}

/**
 * Resumes autoplaying media inside `el`.
 * @param {Element} el
 */
export function playMedia(el) {
  el.querySelectorAll('video[autoplay]').forEach((v) => {
    const play = v.play();
    if (play && play.catch) play.catch(() => { /* autoplay blocked */ });
  });
  el.querySelectorAll('iframe[src*="youtube"]').forEach((f) => {
    try {
      f.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
        '*',
      );
    } catch { /* ignore */ }
  });
  el.querySelectorAll('iframe[src*="vimeo"]').forEach((f) => {
    try { f.contentWindow.postMessage({ method: 'play' }, '*'); } catch { /* ignore */ }
  });
}
