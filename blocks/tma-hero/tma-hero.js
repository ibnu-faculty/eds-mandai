import { moveInstrumentation } from '../../scripts/scripts.js';
import {
  loadTmaTheme, optimizePicture, cellText, buildButton,
} from '../../scripts/tma.js';

/*
 * Tokio Marine Asia hero.
 *
 * Row order, as emitted by the xwalk renderer:
 *   0        background image   (image + imageAlt render as one cell)
 *   1        heading            "Tokio Marine protect what"
 *   2        headingAccent      "matters most" — rendered teal, on its own line
 *   3        description
 *   4..n     one row per BUTTON, cells: [cta, variant]
 *            (cta + ctaText is a collapsible group, so it arrives as ONE cell
 *             holding an anchor whose text is already the button label)
 *
 * The heading is split across two authored fields rather than one rich-text
 * field because the accent is a fixed part of the design, not arbitrary inline
 * markup: two plain text inputs keep the Universal Editor form obvious and stop
 * an author from having to know that "italic means teal".
 *
 * Buttons are repeatable children rather than two fixed CTA field pairs. That
 * keeps the block within xwalk's four-cells-per-block limit AND lets a page run
 * one, two, or three CTAs without a model change.
 *
 * Layout differs by breakpoint in the Figma file, not just in scale — on mobile
 * the copy sits above the image on white, on desktop it overlays the image. The
 * DOM is built once in the mobile (stacked) order and CSS promotes it to an
 * overlay at 900px; see tma-hero.css.
 */
const CONTAINER_ROWS = 4;
const VARIANTS = ['primary', 'secondary'];

export default async function decorate(block) {
  await loadTmaTheme();

  const rows = [...block.children];
  const [imageRow, headingRow, accentRow, descRow] = rows;

  const picture = imageRow?.querySelector('picture');
  const heading = cellText(headingRow);
  const accent = cellText(accentRow);
  const description = cellText(descRow);

  const content = document.createElement('div');
  content.className = 'tma-hero__content';

  if (heading || accent) {
    const h1 = document.createElement('h1');
    h1.className = 'tma-hero__heading';
    if (heading) h1.append(document.createTextNode(`${heading} `));
    if (accent) {
      const span = document.createElement('span');
      span.className = 'tma-hero__heading-accent';
      span.textContent = accent;
      h1.append(span);
    }
    content.append(h1);
  }

  if (description) {
    const p = document.createElement('p');
    p.className = 'tma-hero__description';
    p.textContent = description;
    content.append(p);
  }

  const actions = document.createElement('div');
  actions.className = 'tma-hero__actions';
  rows.slice(CONTAINER_ROWS).forEach((row, i) => {
    const [ctaCell, variantCell] = [...row.children];
    const variant = VARIANTS.includes(cellText(variantCell))
      ? cellText(variantCell)
      : VARIANTS[i % VARIANTS.length];
    const button = buildButton(ctaCell, variant);
    if (!button) return;
    moveInstrumentation(row, button);
    actions.append(button);
  });
  if (actions.children.length) content.append(actions);

  const media = document.createElement('div');
  media.className = 'tma-hero__media';
  if (picture) {
    // eager: the hero image is the LCP element on this page
    optimizePicture(picture, { eager: true });
    media.append(picture);
  }

  block.innerHTML = '';
  block.append(media, content);
}
