import { moveInstrumentation } from '../../scripts/scripts.js';
import {
  loadTmaTheme, optimizePicture, cellText,
} from '../../scripts/tma.js';

/*
 * TMA site header — logo left, country switcher right.
 *
 * Row order, as emitted by the xwalk renderer:
 *   0        logo         image + alt, one cell
 *   1        homeLink     where the logo points
 *   2..n     one row per COUNTRY, cells: [flag, name, shortName, link]
 *
 * The switcher is a disclosure, not a <select>: the design shows a flag beside
 * each country, which a native select cannot render. It is built from a real
 * <button aria-expanded> + <ul>, so it stays keyboard- and screen-reader-
 * operable; Escape and outside-click both close it.
 *
 * The FIRST country row is the current one, and the model's field description
 * says so. A separate `current` boolean would have pushed this block past
 * xwalk's four-cells-per-block limit to buy nothing an author cannot already
 * express by ordering the list.
 */
const CONTAINER_ROWS = 2;

/**
 * Builds the flag + label pair shown for a country, in both the toggle and the
 * list, so the two never drift apart.
 * @param {Element} flagCell The cell holding the flag image
 * @param {string} name The country's full name
 * @param {string} shortName The country's abbreviated name
 * @returns {DocumentFragment} The flag and label nodes
 */
function countryLabel(flagCell, name, shortName) {
  const frag = document.createDocumentFragment();

  const picture = flagCell?.querySelector('picture');
  const media = picture || flagCell?.querySelector('img, svg, .icon');
  if (media) {
    if (media.tagName === 'PICTURE') optimizePicture(media);
    const flag = document.createElement('span');
    flag.className = 'tma-header__flag';
    flag.append(media);
    frag.append(flag);
  }

  const label = document.createElement('span');
  label.className = 'tma-header__country-name';
  label.textContent = name;
  frag.append(label);

  /*
   * Both spellings are always in the DOM and CSS picks one by breakpoint. The
   * alternative — swapping textContent on resize — would need a matchMedia
   * listener per header and would still flash the wrong label on first paint.
   */
  if (shortName) {
    label.classList.add('tma-header__country-name--long');
    const short = document.createElement('span');
    short.className = 'tma-header__country-name tma-header__country-name--short';
    short.textContent = shortName;
    frag.append(short);
  }

  return frag;
}

export default async function decorate(block) {
  await loadTmaTheme();

  const rows = [...block.children];
  const [logoRow, homeRow] = rows;

  const countries = rows.slice(CONTAINER_ROWS).map((row) => {
    const [flagCell, nameCell, shortCell, linkCell] = [...row.children];
    return {
      row,
      flagCell,
      name: cellText(nameCell),
      shortName: cellText(shortCell),
      href: linkCell?.querySelector('a')?.getAttribute('href') || '',
    };
  }).filter((c) => c.name);

  const inner = document.createElement('div');
  inner.className = 'tma-header__inner';

  // brand
  const picture = logoRow?.querySelector('picture');
  const homeHref = homeRow?.querySelector('a')?.getAttribute('href') || cellText(homeRow) || '/';
  if (picture) {
    optimizePicture(picture, { eager: true, breakpoints: [{ width: '400' }] });
    const brand = document.createElement('a');
    brand.className = 'tma-header__brand';
    brand.setAttribute('href', homeHref);
    brand.append(picture);
    inner.append(brand);
  }

  // country switcher
  if (countries.length) {
    const [active] = countries;

    const switcher = document.createElement('div');
    switcher.className = 'tma-header__switcher';

    const toggle = document.createElement('button');
    toggle.className = 'tma-header__toggle';
    toggle.setAttribute('type', 'button');
    toggle.setAttribute('aria-expanded', 'false');

    const srLabel = document.createElement('span');
    srLabel.className = 'tma-sr-only';
    srLabel.textContent = 'Select country';
    toggle.append(srLabel);
    toggle.append(countryLabel(active.flagCell, active.name, active.shortName));

    const chevron = document.createElement('span');
    chevron.className = 'tma-header__chevron';
    chevron.setAttribute('aria-hidden', 'true');
    toggle.append(chevron);

    const list = document.createElement('ul');
    list.className = 'tma-header__country-list';
    list.hidden = true;

    countries.forEach((country) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'tma-header__country-link';
      link.setAttribute('href', country.href || '#');
      if (country === active) link.setAttribute('aria-current', 'true');
      link.append(countryLabel(country.flagCell, country.name, country.shortName));
      li.append(link);
      moveInstrumentation(country.row, li);
      list.append(li);
    });

    const close = () => {
      toggle.setAttribute('aria-expanded', 'false');
      list.hidden = true;
    };

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      list.hidden = open;
    });

    switcher.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !list.hidden) {
        close();
        toggle.focus();
      }
    });

    document.addEventListener('click', (e) => {
      if (!list.hidden && !switcher.contains(e.target)) close();
    });

    switcher.append(toggle, list);
    inner.append(switcher);
  }

  block.innerHTML = '';
  block.append(inner);
}
