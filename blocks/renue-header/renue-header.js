import { getMetadata } from '../../scripts/aem.js';
import { loadPlainFragment, loadRenueTheme } from '../../scripts/renue.js';

/*
 * Re:Nue header block.
 *
 * Cell layout: row 0 = navPath, row 1 = announcement.
 *
 * NOTE: this is an in-page block, not the site chrome. The <header> element on
 * every page belongs to Mandai's blocks/header.
 *
 * AUTHORING CONTRACT — the nav comes from an ordinary authored page, and this
 * block BUILDS the markup from it. The previous version inlined the fragment
 * verbatim and then looked for `.renue-header__menu-toggle` / `.renue-header__nav`,
 * classes that only ever existed in a hand-written fixture: AEM authoring emits
 * semantic HTML, never custom BEM classes, so the nav could never be authored.
 * This follows blocks/header/header.js instead, which reads authored content and
 * constructs its own structure.
 *
 * The nav page just needs, in any order:
 *   - a link that is NOT in a list  -> the logo (text or an image)
 *   - a bulleted list of links      -> the nav items
 *
 * Path precedence: authored `navPath` -> page metadata `renue-nav`. The metadata
 * key is brand-scoped on purpose: the bare `nav` key is Mandai's, and reusing it
 * would make a Re:Nue block render Mandai's navigation.
 */

/**
 * Builds the nav bar from an authored fragment.
 * @param {Element} source The loaded fragment
 * @returns {Element} The nav bar element
 */
function buildNavBar(source) {
  const navBar = document.createElement('div');
  navBar.className = 'renue-header__nav-bar';

  // Logo: the first link that is not part of a list. Its authored content is
  // kept as-is so an image logo works as well as a wordmark.
  const logoSource = [...source.querySelectorAll('a[href]')].find((a) => !a.closest('ul, ol'));
  if (logoSource) {
    const logo = document.createElement('a');
    logo.className = 'renue-header__logo';
    logo.href = logoSource.getAttribute('href');
    logo.append(...logoSource.childNodes);
    if (!logo.textContent.trim()) logo.setAttribute('aria-label', 'Re:Nue home');
    navBar.append(logo);
  }

  const links = [...source.querySelectorAll('ul > li > a[href], ol > li > a[href]')];
  if (!links.length) return navBar;

  const toggle = document.createElement('button');
  toggle.className = 'renue-header__menu-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'renue-primary-nav');
  toggle.innerHTML = '<span></span><span></span><span></span><span class="renue-sr-only">Toggle menu</span>';
  navBar.append(toggle);

  const nav = document.createElement('nav');
  nav.className = 'renue-header__nav';
  nav.id = 'renue-primary-nav';
  nav.setAttribute('aria-label', 'Primary');

  const list = document.createElement('ul');
  list.className = 'renue-header__nav-list';
  links.forEach((a) => {
    const li = document.createElement('li');
    li.append(a);
    list.append(li);
  });
  nav.append(list);
  navBar.append(nav);

  toggle.addEventListener('click', () => {
    const isOpen = nav.getAttribute('data-open') === 'true';
    nav.setAttribute('data-open', String(!isOpen));
    toggle.setAttribute('aria-expanded', String(!isOpen));
  });

  return navBar;
}

export default async function decorate(block) {
  await loadRenueTheme();

  const rows = [...block.children];
  const pathEl = rows[0]?.querySelector('a, div');
  const authoredPath = pathEl?.getAttribute?.('href') || pathEl?.textContent?.trim();
  const navPath = authoredPath || getMetadata('renue-nav');
  const announcementText = rows[1]?.textContent?.trim();

  block.innerHTML = '';

  // Announcement bar — author-controlled. Rendering hardcoded marketing copy
  // when the field is empty only looks like a bug to whoever left it blank.
  if (announcementText) {
    const announcement = document.createElement('div');
    announcement.className = 'renue-header__announcement';
    const text = document.createElement('p');
    text.className = 'renue-header__announcement-text';
    text.textContent = announcementText;
    const close = document.createElement('button');
    close.className = 'renue-header__announcement-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Dismiss announcement');
    close.innerHTML = '&times;';
    close.addEventListener('click', () => {
      announcement.remove();
    });
    announcement.append(text, close);
    block.append(announcement);
  }

  if (!navPath) return;

  const fragment = await loadPlainFragment(navPath);
  if (!fragment) {
    // eslint-disable-next-line no-console
    console.error(
      `[renue-header] could not load nav content from "${navPath}" — check the Renue Header `
        + 'block\'s nav page field (or the page-level "renue-nav" metadata).',
    );
    return;
  }

  const navBar = buildNavBar(fragment);
  // Only attach once there is something in it; an empty bar still paints its
  // background and padding, which reads as unexplained blank space.
  if (navBar.children.length) block.append(navBar);
}
