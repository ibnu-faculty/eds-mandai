import { moveInstrumentation } from '../../scripts/scripts.js';
import {
  loadTmaTheme, cellText, buildIconTile, buildButton,
} from '../../scripts/tma.js';

/*
 * TMA "Need assistance?" section.
 *
 * Row order, as emitted by the xwalk renderer:
 *   0        heading      "Need assistance?"
 *   1        description
 *   2..n     one row per CARD, cells: [icon, title, cta, variant]
 *            (cta + ctaText is a collapsible group, so it arrives as ONE cell
 *             holding an anchor whose text is already the button label)
 *
 * The card's button variant is authored because the Figma file gives the two
 * cards different button colours — deep teal for general, light teal for life —
 * which is a brand distinction between the two entities, not an ordering rule.
 * Left empty, cards alternate primary/secondary so a pair still looks right.
 */
const CONTAINER_ROWS = 2;
const VARIANTS = ['primary', 'secondary'];

/**
 * Builds one card from its authored row.
 * @param {Element} row The card's row
 * @param {number} index The card's position, used for the variant fallback
 * @returns {Element|null} The card, or null when nothing was authored
 */
function buildCard(row, index) {
  const [iconCell, titleCell, ctaCell, variantCell] = [...row.children];
  const title = cellText(titleCell);
  const variant = VARIANTS.includes(cellText(variantCell))
    ? cellText(variantCell)
    : VARIANTS[index % VARIANTS.length];
  const cta = buildButton(ctaCell, variant);

  if (!title && !cta) return null;

  const card = document.createElement('li');
  card.className = 'tma-assistance__card';

  const head = document.createElement('div');
  head.className = 'tma-assistance__card-head';
  head.append(buildIconTile(iconCell, 'md'));

  if (title) {
    const h3 = document.createElement('h3');
    h3.className = `tma-assistance__card-title tma-assistance__card-title--${variant}`;
    h3.textContent = title;
    head.append(h3);
  }
  card.append(head);
  if (cta) card.append(cta);

  moveInstrumentation(row, card);
  return card;
}

export default async function decorate(block) {
  await loadTmaTheme();

  const rows = [...block.children];
  const [headingRow, descRow] = rows;

  const intro = document.createElement('div');
  intro.className = 'tma-assistance__intro';

  const heading = cellText(headingRow);
  if (heading) {
    const h2 = document.createElement('h2');
    h2.className = 'tma-assistance__heading';
    h2.textContent = heading;
    intro.append(h2);
  }

  const description = cellText(descRow);
  if (description) {
    const p = document.createElement('p');
    p.className = 'tma-assistance__description';
    p.textContent = description;
    intro.append(p);
  }

  const list = document.createElement('ul');
  list.className = 'tma-assistance__cards';
  rows.slice(CONTAINER_ROWS).forEach((row, i) => {
    const card = buildCard(row, i);
    if (card) list.append(card);
  });

  block.innerHTML = '';
  block.append(intro);
  if (list.children.length) block.append(list);
}
