import { moveInstrumentation } from '../../scripts/scripts.js';
import { loadRenueTheme } from '../../scripts/renue.js';

/*
 * Re:Nue Stats banner.
 *
 * Cell layout, as emitted by the xwalk renderer:
 *   row 0                    `copy` (description)
 *   row 1                    `cta` — the cta/ctaText model fields are a
 *                            collapsible pair, so this single cell holds an
 *                            anchor whose text is already the button label
 *   row 2..n, one per stat    [icon, label, value, suffix] as CELLS
 *
 * Repeatable children use the `.../block/v1/block/item` resource type, which
 * renders each item as a plain row inside this block — NOT as a nested block
 * with its own class. So each stat is built here from its cells (same pattern
 * as blocks/feature-carousel/feature-carousel.js), and `moveInstrumentation`
 * carries the data-aue-* attributes across so fields stay click-to-edit in
 * Universal Editor.
 *
 * Designer annotation on this section in Figma: "Numbers to be animated as
 * running numbers" — each value counts up the first time it scrolls into view.
 */

// number of leading rows that belong to this block rather than to a stat
const CONTAINER_ROWS = 2;

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

/**
 * Counts an element's text up to its `data-count-to` value.
 * @param {Element} el The element holding the value
 */
function animateValue(el) {
  const target = parseInt(el.dataset.countTo, 10) || 0;
  const suffix = el.dataset.suffix || '';
  const duration = 1200;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    el.textContent = Math.round(eased * target).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/**
 * Runs the count-up once, the first time the element becomes visible.
 * @param {Element} el The element holding the value
 */
function animateOnVisible(el) {
  if (!el) return;
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateValue(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 },
  );
  observer.observe(el);
}

/**
 * Builds one stat from its authored row.
 * @param {Element} row The item row
 * @returns {Element} The stat list item
 */
function buildStat(row) {
  const [iconCell, labelCell, valueCell, suffixCell] = [...row.children];

  const item = document.createElement('li');
  item.className = 'renue-stats__item';

  const icon = document.createElement('span');
  icon.className = 'renue-stats__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = cellText(iconCell);
  moveInstrumentation(iconCell, icon);

  const label = document.createElement('span');
  label.className = 'renue-stats__label';
  label.textContent = cellText(labelCell);
  moveInstrumentation(labelCell, label);

  const value = document.createElement('span');
  value.className = 'renue-stats__value';
  value.dataset.countTo = parseInt(cellText(valueCell), 10) || 0;
  value.dataset.suffix = cellText(suffixCell);
  value.textContent = '0';
  moveInstrumentation(valueCell, value);

  item.append(icon, label, value);
  moveInstrumentation(row, item);
  return item;
}

export default async function decorate(block) {
  await loadRenueTheme();

  const rows = [...block.children];
  const [copyRow, ctaRow] = rows;

  const copyEl = copyRow ? copyRow.firstElementChild || copyRow : null;
  const cta = ctaRow ? ctaRow.querySelector('a[href]') : null;

  const list = document.createElement('ul');
  list.className = 'renue-stats__list';
  rows.slice(CONTAINER_ROWS).forEach((row) => list.append(buildStat(row)));

  // Assembled in a fragment so the authored elements are moved out of `block`
  // before it is emptied; the block root itself carries the container styling.
  const content = document.createDocumentFragment();
  content.append(list);

  if (copyEl && copyEl.textContent.trim()) {
    copyEl.classList.add('renue-stats__copy');
    content.append(copyEl);
  }
  if (cta) {
    cta.className = 'renue-btn renue-btn--dark';
    content.append(cta);
  }

  block.innerHTML = '';
  block.append(content);

  block.querySelectorAll('[data-count-to]').forEach(animateOnVisible);
}
