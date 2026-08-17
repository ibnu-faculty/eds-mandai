import { getMetadata } from '../../scripts/aem.js';
import { loadPlainFragment, loadRenueTheme } from '../../scripts/renue.js';

/*
 * Re:Nue header block — content is sourced from an Experience Fragment (see
 * _renue-header.json "xfPath" field) rather than authored inline, per project
 * decision. The block itself only carries: (1) the XF path, and (2) an
 * optional announcement-bar override text.
 *
 * NOTE: this is an in-page block, not the site chrome. The <header> element on
 * every page still belongs to Mandai's blocks/header — see docs/renue-eds.md.
 *
 * Field order matches _renue-header.json's `models[0].fields` order: row 1 =
 * xfPath, row 2 = announcement. This is the standard Universal Editor
 * -> block-table mapping (one row per field, in model order).
 *
 * Fully dynamic, no hardcoded fallback markup: the nav path resolves as
 * authored `xfPath` -> page metadata `renue-nav` -> project default
 * `/xf/header`, in that order. The metadata key is brand-scoped on purpose:
 * the bare `nav` key is Mandai's, and reusing it here would make a Re:Nue
 * block silently render Mandai's navigation. If the fetch genuinely fails, the
 * nav bar is left empty and a console error is logged rather than silently
 * substituting stale hardcoded content — a broken XF reference should be
 * visibly broken, not hidden behind a copy that quietly drifts out of sync.
 */
export default async function decorate(block) {
  await loadRenueTheme();

  const rows = [...block.children];
  const xfPathEl = rows[0]?.querySelector('a, div');
  const authoredXfPath = xfPathEl?.getAttribute?.('href') || xfPathEl?.textContent?.trim();
  const announcementOverride = rows[1]?.textContent?.trim();
  const xfPath = authoredXfPath || getMetadata('renue-nav') || '/xf/header';

  block.innerHTML = '';

  // --- Announcement bar -----------------------------------------------
  const announcement = document.createElement('div');
  announcement.className = 'renue-header__announcement';
  announcement.innerHTML = `
    <p class="renue-header__announcement-text"></p>
    <button class="renue-header__announcement-close" type="button" aria-label="Dismiss announcement">&times;</button>
  `;
  announcement.querySelector('.renue-header__announcement-text').textContent = announcementOverride
    || 'Both Re:Nue Store & Donation Booth are open! Visit us Monday–Saturday, 8:30am–5:30pm.';
  announcement.querySelector('button').addEventListener('click', () => {
    announcement.style.display = 'none';
  });
  block.append(announcement);

  // --- Nav bar (dynamically fetched from the Experience Fragment — see
  //     loadPlainFragment() in scripts/renue.js) ------------------------
  const navBar = document.createElement('div');
  navBar.className = 'renue-header__nav-bar';
  block.append(navBar);

  const fragment = await loadPlainFragment(xfPath);
  if (fragment) {
    navBar.append(...fragment.childNodes);
  } else {
    // eslint-disable-next-line no-console
    console.error(
      `[renue-header] could not load nav content from "${xfPath}" — check the Re:Nue Header `
        + 'component\'s Experience Fragment field (or the page-level "renue-nav" metadata) in '
        + 'Universal Editor.',
    );
  }

  const toggle = navBar.querySelector('.renue-header__menu-toggle');
  const nav = navBar.querySelector('.renue-header__nav');
  toggle?.addEventListener('click', () => {
    const isOpen = nav.getAttribute('data-open') === 'true';
    nav.setAttribute('data-open', String(!isOpen));
    toggle.setAttribute('aria-expanded', String(!isOpen));
  });
}
