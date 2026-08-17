import { decorateBlock, loadBlock } from '../../scripts/aem.js';
import { loadRenueTheme } from '../../scripts/renue.js';

/*
 * Re:Nue Stats container block. Cell order (see _renue-stats.json): copy, cta —
 * the model's `cta`/`ctaText` pair is a collapsible field group, so it arrives
 * as a single cell holding an anchor whose text is already the button label.
 * Repeatable `renue-stat-item` children (icon/label/value/suffix) are authored
 * as child components inside this container — each renders/decorates itself
 * via blocks/renue-stat-item/renue-stat-item.js and is simply re-parented into
 * the <ul> this block builds.
 *
 * NOTE: nested child components are NOT picked up by the top-level
 * decorateBlocks() scan in scripts/aem.js (that only scans direct children
 * of a `.section`) — a container block is responsible for decorating +
 * loading its own children itself, which is what the decorateBlock/loadBlock
 * calls below do.
 */
export default async function decorate(block) {
  await loadRenueTheme();

  const [copyRow, ctaRow] = [...block.children].filter(
    (el) => !el.classList.contains('renue-stat-item'),
  );
  const statItems = [...block.querySelectorAll(':scope > .renue-stat-item')];
  statItems.forEach(decorateBlock);
  await Promise.all(statItems.map(loadBlock));

  const copyEl = copyRow?.firstElementChild || copyRow;
  const ctaLinkEl = ctaRow?.querySelector('a');

  const list = document.createElement('ul');
  list.className = 'renue-stats__list';
  statItems.forEach((item) => list.append(item));

  // Assembled in a fragment so the authored elements are moved out of `block`
  // before it is emptied; the block root itself carries the container styling.
  const content = document.createDocumentFragment();
  content.append(list);

  if (copyEl) {
    copyEl.classList.add('renue-stats__copy');
    content.append(copyEl);
  }
  if (ctaLinkEl) {
    ctaLinkEl.className = 'renue-btn renue-btn--dark';
    content.append(ctaLinkEl);
  }

  block.innerHTML = '';
  block.append(content);
}
