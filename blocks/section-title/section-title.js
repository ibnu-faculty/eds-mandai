import { moveInstrumentation } from '../../scripts/scripts.js';

/*
 * Ports wrs/components/commons/sectiontitle.
 *
 * Authored rows: heading, anchor id, alignment, link, bottom padding.
 * Produces the same markup the HTL emitted:
 *   <div class="md section-title-space {padding}">
 *     <div class="sm-container"><div class="grid">
 *       <hN id="{anchor}" class="title-block {align}">…</hN>
 *     </div></div>
 *   </div>
 */

const ALIGNMENTS = ['title-left', 'title-center', 'title-right'];
const PADDINGS = [
  'section-title-space--small-padding-bottom',
  'section-title-space--no-padding-bottom',
];

function rowText(row) {
  return row ? row.textContent.trim() : '';
}

export default function decorate(block) {
  const rows = [...block.children];
  const [headingRow, anchorRow, alignRow, linkRow, paddingRow] = rows;

  const headingSource = headingRow ? headingRow.querySelector(':scope > div') || headingRow : null;
  let heading = headingSource
    ? headingSource.querySelector('h1, h2, h3, h4, h5, h6')
    : null;

  if (!heading && headingSource && headingSource.textContent.trim()) {
    heading = document.createElement('h2');
    heading.innerHTML = headingSource.innerHTML;
  }
  if (!heading) {
    block.replaceChildren();
    return;
  }

  heading.classList.add('title-block');

  const align = rowText(alignRow);
  heading.classList.add(ALIGNMENTS.includes(align) ? align : 'title-center');

  const anchor = rowText(anchorRow);
  if (anchor) heading.id = anchor;

  const link = linkRow ? linkRow.querySelector('a[href]') : null;
  if (link) {
    const anchorEl = document.createElement('a');
    anchorEl.href = link.href;
    anchorEl.innerHTML = heading.innerHTML;
    heading.replaceChildren(anchorEl);
  }

  const grid = document.createElement('div');
  grid.className = 'grid';
  grid.append(heading);

  const container = document.createElement('div');
  container.className = 'sm-container';
  container.append(grid);

  if (headingRow) moveInstrumentation(headingRow, heading);

  block.classList.add('md', 'section-title-space');
  const padding = rowText(paddingRow);
  if (PADDINGS.includes(padding)) block.classList.add(padding);

  block.replaceChildren(container);
}
