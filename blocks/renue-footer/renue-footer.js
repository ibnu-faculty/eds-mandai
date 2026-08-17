import { getMetadata } from '../../scripts/aem.js';
import { loadPlainFragment, loadRenueTheme } from '../../scripts/renue.js';

/*
 * Re:Nue footer block.
 *
 * Cell layout: row 0 = contentPath.
 *
 * NOTE: this is an in-page block, not the site chrome. The <footer> element on
 * every page belongs to Mandai's blocks/footer.
 *
 * AUTHORING CONTRACT — same rework as the header (see
 * blocks/renue-header/renue-header.js): the content comes from an ordinary
 * authored page and this block BUILDS the structure from it, rather than
 * inlining markup that had to already carry `.renue-footer__*` classes — which
 * AEM authoring cannot emit.
 *
 * The footer page just needs one section per column, each containing:
 *   - an optional heading  -> the column title
 *   - a bulleted list of links, and/or paragraphs of text
 * Any paragraph containing '©' is treated as the copyright line and moved to
 * the bottom bar. The first column is styled as the brand column.
 *
 * Path precedence: authored `contentPath` -> page metadata `renue-footer`. The
 * metadata key is brand-scoped on purpose: the bare `footer` key is Mandai's.
 */

/**
 * Builds one footer column from an authored section.
 * @param {Element} source The authored section element
 * @param {boolean} isBrand Whether this is the first (brand) column
 * @returns {Element} The column element
 */
function buildColumn(source, isBrand) {
  const col = document.createElement(source.querySelector('ul, ol') ? 'nav' : 'div');
  col.className = 'renue-footer__col';
  if (isBrand) col.classList.add('renue-footer__brand');

  const heading = source.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    const h3 = document.createElement('h3');
    h3.append(...heading.childNodes);
    col.append(h3);
    if (col.tagName === 'NAV') col.setAttribute('aria-label', h3.textContent.trim());
    heading.remove();
  }

  // The brand column's first paragraph is the wordmark, the rest is the tagline.
  const paragraphs = [...source.querySelectorAll('p')];
  paragraphs.forEach((p, i) => {
    if (isBrand) p.classList.add(i === 0 ? 'renue-footer__logo' : 'renue-footer__tagline');
    col.append(p);
  });

  source.querySelectorAll('ul, ol').forEach((list) => {
    // A list of bare (unlinked) items is contact info rather than navigation.
    if (!list.querySelector('a[href]')) list.classList.add('renue-footer__contact');
    col.append(list);
  });

  return col;
}

export default async function decorate(block) {
  await loadRenueTheme();

  const rows = [...block.children];
  const pathEl = rows[0]?.querySelector('a, div');
  const authoredPath = pathEl?.getAttribute?.('href') || pathEl?.textContent?.trim();
  const contentPath = authoredPath || getMetadata('renue-footer');

  block.innerHTML = '';
  if (!contentPath) return;

  const fragment = await loadPlainFragment(contentPath);
  if (!fragment) {
    // eslint-disable-next-line no-console
    console.error(
      `[renue-footer] could not load footer content from "${contentPath}" — check the Renue `
        + 'Footer block\'s content page field (or the page-level "renue-footer" metadata).',
    );
    return;
  }

  // Pull the copyright out before columns are built, so it lands in the bottom
  // bar rather than inside whichever column happened to hold it.
  const copyright = [...fragment.querySelectorAll('p')].find((p) => p.textContent.includes('©'));
  if (copyright) copyright.remove();

  const sources = [...fragment.children].filter((el) => el.textContent.trim() || el.querySelector('img'));

  const top = document.createElement('div');
  top.className = 'renue-footer__top';
  sources.forEach((source, i) => {
    const col = buildColumn(source, i === 0);
    if (col.children.length) top.append(col);
  });
  if (top.children.length) block.append(top);

  const bottom = document.createElement('div');
  bottom.className = 'renue-footer__bottom';
  if (copyright) {
    copyright.className = 'renue-footer__copyright';
    // A live year beats a hardcoded one going stale.
    if (copyright.querySelector('[data-current-year]')) {
      copyright.querySelector('[data-current-year]').textContent = new Date().getFullYear();
    }
    bottom.append(copyright);
  }
  if (bottom.children.length) block.append(bottom);
}
