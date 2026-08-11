/*
 * Ports wrs/components/commons/richtext.
 *
 * The authored content is free-form rich text; the block only supplies the
 * wrapper the AEM component emitted:
 *   <div class="sm-container"><div class="md rich-text">
 *     <div class="grid"><div class="one-column-only-text">…</div></div>
 *   </div></div>
 *
 * A `grid-small` variant narrows the measure, matching the component's
 * "small container" option.
 */

export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'one-column-only-text';
  content.append(...block.childNodes);

  const grid = document.createElement('div');
  grid.className = block.classList.contains('narrow') ? 'grid-small' : 'grid';
  grid.append(content);

  const container = document.createElement('div');
  container.className = 'sm-container';

  block.classList.add('md');
  block.replaceChildren(container);
  container.append(grid);
}
