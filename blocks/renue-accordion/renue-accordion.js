import { decorateBlock, loadBlock } from '../../scripts/aem.js';
import { loadRenueTheme } from '../../scripts/renue.js';

/*
 * Re:Nue Accordion (values) container. Field order: heading, subheading.
 * Repeatable `renue-accordion-item` children carry the actual value entries.
 * See blocks/renue-stats/renue-stats.js for why this container decorates +
 * loads its own children explicitly.
 */
export default async function decorate(block) {
  await loadRenueTheme();

  const [headingRow, subheadingRow] = [...block.children].filter(
    (el) => !el.classList.contains('renue-accordion-item'),
  );
  const items = [...block.querySelectorAll(':scope > .renue-accordion-item')];
  items.forEach(decorateBlock);
  await Promise.all(items.map(loadBlock));

  const headingEl = headingRow?.firstElementChild || headingRow;
  const subheadingEl = subheadingRow?.firstElementChild || subheadingRow;

  // Assembled in a fragment so the authored elements are moved out of `block`
  // before it is emptied; the block root itself carries the container styling.
  const content = document.createDocumentFragment();

  if (headingEl) {
    const h2 = document.createElement('h2');
    h2.className = 'renue-accordion__heading';
    h2.append(...headingEl.childNodes);
    content.append(h2);
  }
  if (subheadingEl) {
    subheadingEl.classList.add('renue-accordion__subheading');
    content.append(subheadingEl);
  }

  const list = document.createElement('div');
  list.className = 'renue-accordion__list';
  items.forEach((item) => list.append(item));
  content.append(list);

  block.innerHTML = '';
  block.append(content);

  // Single-open-at-a-time behaviour, matching the Figma mock (only
  // "Purposeful" expanded by default).
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
