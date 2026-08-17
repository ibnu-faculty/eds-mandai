import { moveInstrumentation } from '../../scripts/scripts.js';
import { loadRenueTheme } from '../../scripts/renue.js';

/*
 * Re:Nue Accordion (values).
 *
 * Cell layout, as emitted by the xwalk renderer:
 *   row 0                     `heading`
 *   row 1                     `subheading`
 *   row 2..n, one per value    [accentColor, title, body, openByDefault] as CELLS
 *
 * Repeatable children use the `.../block/v1/block/item` resource type, which
 * renders each item as a plain row inside this block — NOT as a nested block
 * with its own class. So each value is built here from its cells (same pattern
 * as blocks/feature-carousel/feature-carousel.js), and `moveInstrumentation`
 * carries the data-aue-* attributes across so fields stay click-to-edit in
 * Universal Editor.
 */

// number of leading rows that belong to this block rather than to a value
const CONTAINER_ROWS = 2;

const ACCENT_MAP = {
  blue: 'var(--renue-color-accent-blue)',
  red: 'var(--renue-color-accent-red)',
  gold: 'var(--renue-color-accent-gold)',
};

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

/**
 * Builds one accordion value from its authored row.
 * @param {Element} row The item row
 * @returns {Element} The <details> element
 */
function buildItem(row) {
  const [accentCell, titleCell, bodyCell, openCell] = [...row.children];
  const accent = cellText(accentCell).toLowerCase();

  const details = document.createElement('details');
  details.className = 'renue-accordion__item';
  if (/^(true|yes|on)$/i.test(cellText(openCell))) details.open = true;

  const summary = document.createElement('summary');
  summary.className = 'renue-accordion__summary';

  const icon = document.createElement('span');
  icon.className = 'renue-accordion__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.style.background = ACCENT_MAP[accent] || ACCENT_MAP.blue;
  icon.textContent = '●';
  summary.append(icon);

  const title = document.createElement('span');
  title.className = 'renue-accordion__title';
  title.textContent = cellText(titleCell);
  moveInstrumentation(titleCell, title);
  summary.append(title);
  details.append(summary);

  if (bodyCell && bodyCell.textContent.trim()) {
    bodyCell.classList.add('renue-accordion__body');
    details.append(bodyCell);
  }

  moveInstrumentation(row, details);
  return details;
}

export default async function decorate(block) {
  await loadRenueTheme();

  const rows = [...block.children];
  const [headingRow, subheadingRow] = rows;

  const headingEl = headingRow ? headingRow.firstElementChild || headingRow : null;
  const subheadingEl = subheadingRow ? subheadingRow.firstElementChild || subheadingRow : null;

  const list = document.createElement('div');
  list.className = 'renue-accordion__list';
  rows.slice(CONTAINER_ROWS).forEach((row) => list.append(buildItem(row)));

  // Assembled in a fragment so the authored elements are moved out of `block`
  // before it is emptied; the block root itself carries the container styling.
  const content = document.createDocumentFragment();

  if (headingEl && headingEl.textContent.trim()) {
    const h2 = document.createElement('h2');
    h2.className = 'renue-accordion__heading';
    h2.textContent = headingEl.textContent.trim();
    moveInstrumentation(headingEl, h2);
    content.append(h2);
  }
  if (subheadingEl && subheadingEl.textContent.trim()) {
    subheadingEl.classList.add('renue-accordion__subheading');
    content.append(subheadingEl);
  }
  content.append(list);

  block.innerHTML = '';
  block.append(content);

  // Single-open-at-a-time behaviour, matching the Figma mock.
  const details = list.querySelectorAll('details');
  details.forEach((d) => {
    d.addEventListener('toggle', () => {
      if (!d.open) return;
      details.forEach((other) => {
        if (other !== d) other.open = false;
      });
    });
  });
}
