import { moveInstrumentation } from '../../scripts/scripts.js';
import {
  loadTmaTheme, cellText, buildIconTile,
} from '../../scripts/tma.js';

/*
 * TMA product group — one insurance entity and the products it offers.
 *
 * Row order, as emitted by the xwalk renderer:
 *   0            icon      the group's 56px rounded tile
 *   1            title     "Tokio Marine Insurance Singapore"
 *   2            subtitle  "General Insurance"
 *   3..n         one row per PILL, cells: [icon, label, link, tint]
 *
 * Pills are repeatable children (core/franklin/components/block/v1/block/item),
 * so they arrive as plain rows with one cell per field and no class of their
 * own — the same shape blocks/renue-hero/renue-hero.js consumes.
 *
 * `tint` is authored rather than derived. The Figma file assigns the four pill
 * tints per product, not in a repeating cycle (the life column runs
 * pink/blue/green/pink/orange/blue/green), so any index-based rule would be
 * wrong for most of them. When an author leaves it empty we fall back to
 * cycling, which keeps a half-filled group looking deliberate.
 *
 * moveInstrumentation() carries each pill row's data-aue-* attributes onto the
 * element built from it, so every pill stays click-to-edit in Universal Editor.
 */
const TINTS = ['1', '2', '3', '4'];

// leading rows that belong to the group itself rather than to a pill
const CONTAINER_ROWS = 3;

/**
 * Builds one pill from its authored row.
 * @param {Element} row The pill's row
 * @param {number} index The pill's position, used for the tint fallback
 * @returns {Element|null} The pill, or null when nothing was authored
 */
function buildPill(row, index) {
  const [iconCell, labelCell, linkCell, tintCell] = [...row.children];
  const label = cellText(labelCell);
  if (!label) return null;

  const tint = TINTS.includes(cellText(tintCell))
    ? cellText(tintCell)
    : TINTS[index % TINTS.length];

  const href = linkCell?.querySelector('a')?.getAttribute('href');
  const pill = document.createElement(href ? 'a' : 'span');
  pill.className = `tma-product-group__pill tma-product-group__pill--tint-${tint}`;
  if (href) pill.setAttribute('href', href);

  pill.append(buildIconTile(iconCell, 40));

  const text = document.createElement('span');
  text.className = 'tma-product-group__pill-label';
  text.textContent = label;
  pill.append(text);

  moveInstrumentation(row, pill);
  return pill;
}

export default async function decorate(block) {
  await loadTmaTheme();

  const rows = [...block.children];
  const [iconRow, titleRow, subtitleRow] = rows;

  const header = document.createElement('div');
  header.className = 'tma-product-group__header';
  header.append(buildIconTile(iconRow, 56));

  const titleText = cellText(titleRow);
  const subtitleText = cellText(subtitleRow);
  if (titleText || subtitleText) {
    const titles = document.createElement('div');
    titles.className = 'tma-product-group__titles';
    if (titleText) {
      const h3 = document.createElement('h3');
      h3.className = 'tma-product-group__title';
      h3.textContent = titleText;
      titles.append(h3);
    }
    if (subtitleText) {
      const p = document.createElement('p');
      p.className = 'tma-product-group__subtitle';
      p.textContent = subtitleText;
      titles.append(p);
    }
    header.append(titles);
  }

  const list = document.createElement('ul');
  list.className = 'tma-product-group__pills';
  rows.slice(CONTAINER_ROWS).forEach((row, i) => {
    const pill = buildPill(row, i);
    if (!pill) return;
    const li = document.createElement('li');
    li.className = 'tma-product-group__pill-item';
    li.append(pill);
    list.append(li);
  });

  block.innerHTML = '';
  block.append(header);
  if (list.children.length) block.append(list);
}
