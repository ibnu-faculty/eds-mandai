import {
  loadTmaTheme, optimizePicture, cellText,
} from '../../scripts/tma.js';

/*
 * TMA site footer — dark navy panel with the group wordmark, the brand tagline,
 * and a copyright bar.
 *
 * Row order, as emitted by the xwalk renderer:
 *   0        logo       image + alt, one cell
 *   1        tagline    image + alt, one cell — the Figma tagline is set in a
 *                       licensed italic display cut and locked up as artwork,
 *                       so it is authored as an image rather than as text
 *   2        taglineText  accessible text for that artwork, and the fallback
 *                       rendering when no image is supplied
 *   3        copyright
 */
export default async function decorate(block) {
  await loadTmaTheme();

  const [logoRow, taglineRow, taglineTextRow, copyrightRow] = [...block.children];

  const main = document.createElement('div');
  main.className = 'tma-footer__main';

  const logo = logoRow?.querySelector('picture');
  if (logo) {
    optimizePicture(logo, { breakpoints: [{ width: '750' }] });
    const wrap = document.createElement('div');
    wrap.className = 'tma-footer__logo';
    wrap.append(logo);
    main.append(wrap);
  }

  const taglineText = cellText(taglineTextRow);
  const taglineImg = taglineRow?.querySelector('picture');
  if (taglineImg) {
    optimizePicture(taglineImg, { breakpoints: [{ width: '750' }] });
    const img = taglineImg.querySelector('img');
    // the artwork carries the words, so it must not be alt=""
    if (img && taglineText && !img.getAttribute('alt')) img.setAttribute('alt', taglineText);
    const wrap = document.createElement('div');
    wrap.className = 'tma-footer__tagline';
    wrap.append(taglineImg);
    main.append(wrap);
  } else if (taglineText) {
    const p = document.createElement('p');
    p.className = 'tma-footer__tagline tma-footer__tagline--text';
    p.textContent = taglineText;
    main.append(p);
  }

  block.innerHTML = '';
  block.append(main);

  const copyright = cellText(copyrightRow);
  if (copyright) {
    const bar = document.createElement('div');
    bar.className = 'tma-footer__bar';
    const small = document.createElement('p');
    small.className = 'tma-footer__copyright';
    small.textContent = copyright;
    bar.append(small);
    block.append(bar);
  }
}
