import { loadTmaTheme, cellText } from '../../scripts/tma.js';

/*
 * TMA section heading.
 *
 * Row order: heading, headingAccent. Split across two fields for the same
 * reason as the hero's — the teal run is a fixed part of the design rather
 * than arbitrary inline markup, so two plain inputs beat teaching authors that
 * italic means teal. See blocks/tma-hero/tma-hero.js.
 *
 * Kept as its own block rather than folded into tma-product-group because the
 * Figma section heading sits above BOTH product columns; owning it here lets a
 * page place one heading and any number of groups under it.
 */
export default async function decorate(block) {
  await loadTmaTheme();

  const [headingRow, accentRow] = [...block.children];
  const heading = cellText(headingRow);
  const accent = cellText(accentRow);

  const h2 = document.createElement('h2');
  h2.className = 'tma-section-heading__text';
  if (heading) h2.append(document.createTextNode(`${heading} `));
  if (accent) {
    const span = document.createElement('span');
    span.className = 'tma-section-heading__accent';
    span.textContent = accent;
    h2.append(span);
  }

  block.innerHTML = '';
  block.append(h2);
}
