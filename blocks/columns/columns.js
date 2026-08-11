import { moveInstrumentation } from '../../scripts/scripts.js';
import { decorateEqualHeights } from '../../scripts/site.js';

/*
 * Ports wrs/components/commons/columncontrol.
 *
 * Every authored row becomes one grid row; the cells in it become the columns.
 * Column widths follow the column-control dialog options, and all columns in a
 * row are given equal heights (the AEM `match-height.js` behaviour, driven by
 * `data-eq-height`).
 *
 * Reproduces the HTL output:
 *   <div class="md column-control-blocks"><div class="grid"><div class="container">
 *     <div class="row">
 *       <div class="col-md-3 col-xs-6 col-block" data-eq-height=".col-block">…</div>
 *     </div>
 *   </div></div></div>
 *
 * A column holding only an image (optionally followed by a caption) is wrapped
 * as the core image component was, so `.cmp-image` styling still applies.
 */

const DESKTOP_CLASS = {
  1: 'col-md-12',
  2: 'col-md-6',
  3: 'col-md-4',
  4: 'col-md-3',
  6: 'col-md-2',
};

let uid = 0;

function decorateImageColumn(cell) {
  const picture = cell.querySelector('picture');
  if (!picture) return;

  const img = picture.querySelector('img');
  const paragraphs = [...cell.querySelectorAll(':scope > p')];
  const captionSource = paragraphs.find(
    (p) => !p.querySelector('picture') && p.textContent.trim(),
  );

  const cmpImage = document.createElement('div');
  cmpImage.className = 'cmp-image text-center';
  if (img) img.classList.add('cmp-image__image');
  cmpImage.append(picture);

  if (captionSource) {
    const caption = document.createElement('span');
    caption.className = 'cmp-image__title';
    caption.innerHTML = captionSource.innerHTML;
    moveInstrumentation(captionSource, caption);
    cmpImage.append(caption);
    captionSource.remove();
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'image';
  wrapper.append(cmpImage);

  // drop the now-empty paragraph the picture used to live in
  cell.querySelectorAll(':scope > p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('picture, img, a')) p.remove();
  });

  cell.replaceChildren(wrapper);
}

export default function decorate(block) {
  uid += 1;
  const group = `columns-${uid}`;

  const container = document.createElement('div');
  container.className = 'container';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const desktopClass = DESKTOP_CLASS[cells.length] || 'col-md-3';
    const mobileClass = cells.length >= 3 ? 'col-xs-6' : 'col-sm-12';

    cells.forEach((cell) => {
      cell.className = `${desktopClass} ${mobileClass} col-block`;
      cell.setAttribute('data-eq-height', group);
      decorateImageColumn(cell);
    });

    row.className = 'row';
    container.append(row);
  });

  const grid = document.createElement('div');
  grid.className = 'grid';
  grid.append(container);

  block.classList.add('md', 'column-control-blocks');
  block.replaceChildren(grid);

  decorateEqualHeights(block);
}
