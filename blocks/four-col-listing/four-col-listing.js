import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { decorateEqualHeights, decorateIcons, isTrue } from '../../scripts/site.js';

/*
 * Ports wrs/components/mandai/mandaicffourcollisting.
 *
 * Row 1 is the configuration:
 *   [background, heading, heading alignment, anchor id, cta style,
 *    align items, footer cta]
 * Every later row is a card:
 *   [image, title, location labels, date labels, time labels, tags,
 *    short description, cta]
 *
 * Reproduces the HTL output:
 *   <div class="md md-4-col-content-fragment {bg}"><div class="grid">
 *     <h2 class="md-header text-center">…</h2>
 *     <div class="row items-center">
 *       <div class="col-md-3">
 *         <div class="md-4-col-content-fragment__item" data-eq-height="…">
 *           <img …>
 *           <div class="all-content">
 *             <h4>…</h4>
 *             <div class="md-icon-text"><i …></i><div class="body-text3">…</div></div>
 *             <div class="md-tag-label"><div class="md-tag body-text3">…</div></div>
 *             <div class="body-text3">…</div>
 *             <a href=…><div class="md-link-with-arrow">cta
 *               <div class="md-link-arrow">…</div></div></a>
 *           </div>
 *         </div>
 *       </div>
 *     </div>
 *     <div class="div text-center"><a href=…><button class="md-button-big">…</button></a></div>
 *   </div></div>
 */

const BACKGROUNDS = ['bg-base', 'bg-sap-white', 'bg-dark-green'];
const ICONS = {
  location: 'map-marker-alt',
  date: 'calendar-alt',
  time: 'clock',
};

let uid = 0;

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

/** multi-value cells are authored as one value per line or per list item */
function cellValues(cell) {
  if (!cell) return [];
  const items = [...cell.querySelectorAll('li')];
  if (items.length) return items.map((li) => li.textContent.trim()).filter(Boolean);
  return cell.textContent.split('\n').map((v) => v.trim()).filter(Boolean);
}

function buildIconRows(values, iconName) {
  return values.map((value) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'md-icon-text';
    const icon = document.createElement('span');
    icon.className = `icon icon-${iconName}`;
    icon.setAttribute('aria-hidden', 'true');
    const text = document.createElement('div');
    text.className = 'body-text3';
    text.textContent = value;
    wrapper.append(icon, text);
    return wrapper;
  });
}

function buildCard(row, ctaStyle, group) {
  const [
    imageCell, titleCell, locationCell, dateCell, timeCell, tagsCell,
    descriptionCell, ctaCell,
  ] = [...row.children];

  const column = document.createElement('div');
  column.className = 'col-md-3';

  const item = document.createElement('div');
  item.className = 'md-4-col-content-fragment__item';
  if (ctaStyle === 'button') item.classList.add('has-button');
  item.setAttribute('data-eq-height', group);

  const image = imageCell ? imageCell.querySelector('img') : null;
  if (image) {
    const picture = createOptimizedPicture(image.src, image.alt || '', false, [{ width: '750' }]);
    moveInstrumentation(image, picture.querySelector('img'));
    item.append(picture);
  }

  const content = document.createElement('div');
  content.className = 'all-content';

  const title = cellText(titleCell);
  if (title) {
    const heading = titleCell.querySelector('h1, h2, h3, h4, h5, h6') || document.createElement('h4');
    if (!heading.isConnected) heading.textContent = title;
    heading.classList.remove('title-block');
    moveInstrumentation(titleCell, heading);
    content.append(heading);
  }

  content.append(...buildIconRows(cellValues(locationCell), ICONS.location));
  content.append(...buildIconRows(cellValues(dateCell), ICONS.date));
  content.append(...buildIconRows(cellValues(timeCell), ICONS.time));

  const tags = cellValues(tagsCell);
  if (tags.length) {
    const label = document.createElement('div');
    label.className = 'md-tag-label';
    tags.forEach((tag) => {
      const chip = document.createElement('div');
      chip.className = 'md-tag body-text3';
      chip.textContent = tag;
      label.append(chip);
    });
    content.append(label);
  }

  const description = descriptionCell ? descriptionCell.innerHTML.trim() : '';
  if (description) {
    const body = document.createElement('div');
    body.className = 'body-text3';
    body.innerHTML = description;
    moveInstrumentation(descriptionCell, body);
    content.append(body);
  }

  const cta = ctaCell ? ctaCell.querySelector('a[href]') : null;
  item.append(content);
  column.append(item);

  if (cta) {
    const anchor = document.createElement('a');
    anchor.href = cta.getAttribute('href');
    if (cta.target) anchor.target = cta.target;
    if (ctaStyle === 'button') {
      const button = document.createElement('div');
      button.className = 'md-button-big item-with-button';
      button.textContent = cta.textContent.trim();
      anchor.append(button);
      column.append(anchor);
    } else {
      const linkWithArrow = document.createElement('div');
      linkWithArrow.className = 'md-link-with-arrow';
      linkWithArrow.append(document.createTextNode(cta.textContent.trim()));
      const arrow = document.createElement('div');
      arrow.className = 'md-link-arrow';
      const icon = document.createElement('span');
      icon.className = 'icon icon-chevron-right';
      icon.setAttribute('aria-hidden', 'true');
      arrow.append(icon);
      linkWithArrow.append(arrow);
      anchor.append(linkWithArrow);
      content.append(anchor);
    }
  }

  moveInstrumentation(row, column);
  return column;
}

export default function decorate(block) {
  uid += 1;
  const group = `four-col-listing-${uid}`;

  const rows = [...block.children];
  const configRow = rows.shift();
  const configCells = configRow ? [...configRow.children] : [];
  const background = cellText(configCells[0]);
  const headingCell = configCells[1];
  const headingAlign = cellText(configCells[2]);
  const anchorId = cellText(configCells[3]);
  const ctaStyle = cellText(configCells[4]) || 'link';
  const alignItems = isTrue(cellText(configCells[5])) ? 'items-center' : '';
  const footerCta = configCells[6] ? configCells[6].querySelector('a[href]') : null;

  const grid = document.createElement('div');
  grid.className = 'grid';

  const headingText = cellText(headingCell);
  if (headingText) {
    const heading = headingCell.querySelector('h1, h2, h3, h4, h5, h6') || document.createElement('h2');
    if (!heading.isConnected) heading.textContent = headingText;
    heading.classList.add('md-header');
    if (headingAlign === 'title-center') heading.classList.add('text-center');
    moveInstrumentation(headingCell, heading);
    grid.append(heading);
  }

  const row = document.createElement('div');
  row.className = `row${alignItems ? ` ${alignItems}` : ''}`;
  rows.forEach((cardRow) => row.append(buildCard(cardRow, ctaStyle, group)));
  grid.append(row);

  if (footerCta) {
    const wrapper = document.createElement('div');
    wrapper.className = 'div text-center';
    const anchor = document.createElement('a');
    anchor.href = footerCta.getAttribute('href');
    if (footerCta.target) anchor.target = footerCta.target;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'md-button-big';
    button.textContent = footerCta.textContent.trim();
    anchor.append(button);
    wrapper.append(anchor);
    grid.append(wrapper);
  }

  block.classList.add('md', 'md-4-col-content-fragment');
  block.classList.add(BACKGROUNDS.includes(background) ? background : 'bg-base');
  if (anchorId) block.id = anchorId;
  block.replaceChildren(grid);

  decorateIcons(block);
  decorateEqualHeights(block);
}
