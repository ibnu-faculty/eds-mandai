import { getMetadata } from '../../scripts/aem.js';
import { loadPlainFragment, loadRenueTheme } from '../../scripts/renue.js';

/*
 * Re:Nue footer block — same Experience Fragment pattern as the header block
 * (see blocks/renue-header/renue-header.js for the full rationale). Path
 * precedence: authored `xfPath` -> page metadata `renue-footer` -> project
 * default `/xf/footer`. The metadata key is brand-scoped on purpose: the bare
 * `footer` key is Mandai's. No hardcoded fallback markup — if the fetch fails,
 * the footer stays empty and a console error is logged instead of silently
 * showing stale hardcoded content.
 *
 * NOTE: this is an in-page block, not the site chrome. The <footer> element on
 * every page still belongs to Mandai's blocks/footer.
 *
 * loadPlainFragment() rather than blocks/fragment/fragment.js: the footer's
 * column layout is fixed, hand-styled markup (`.renue-footer__top`/
 * `.renue-footer__col` etc are pure CSS layout divs, not authored blocks), so
 * it must skip the generic block-decoration pass fragment.js always applies.
 * If this XF is ever redesigned to hold genuine nested block content, switch
 * to loadFragment() from blocks/fragment/fragment.js instead.
 */
export default async function decorate(block) {
  await loadRenueTheme();

  const rows = [...block.children];
  const xfPathEl = rows[0]?.querySelector('a, div');
  const authoredXfPath = xfPathEl?.getAttribute?.('href') || xfPathEl?.textContent?.trim();
  const xfPath = authoredXfPath || getMetadata('renue-footer') || '/xf/footer';

  block.innerHTML = '';

  const fragment = await loadPlainFragment(xfPath);
  if (fragment) {
    block.append(...fragment.childNodes);
  } else {
    // eslint-disable-next-line no-console
    console.error(
      `[renue-footer] could not load footer content from "${xfPath}" — check the Re:Nue Footer `
        + 'component\'s Experience Fragment field (or the page-level "renue-footer" metadata) in '
        + 'Universal Editor.',
    );
  }

  const yearEl = block.querySelector('[data-current-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}
