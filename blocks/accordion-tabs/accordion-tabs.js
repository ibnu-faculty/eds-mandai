import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import {
  decorateIcons, onWidthChange, TABLET_MQ, whenMeasurable,
} from '../../scripts/site.js';

/*
 * Ports wrs/components/commons/accordiontabs and its accordion-tabs.js plugin.
 *
 * Row 1 is the configuration: [main title, anchor id, no top padding, no bottom padding].
 * Every later row is a tab: [tab name, title, description, cta label, cta link,
 * open in new tab, image].
 *
 * Reproduces the HTL output:
 *   <div class="md md-accordion-tabs" id="…">
 *     <div class="section-title"><h2 class="text-center">…</h2></div>
 *     <div class="grid"><div class="tab_list">
 *       <div class="tab_item active">
 *         <button class="tab_btn-tab">…</button>
 *         <div class="tab_info-container"><div class="tab_info">
 *           <div class="tab_info-content">
 *             <h3 class="tab_info-content_header">…</h3>
 *             <div class="tab_info-content_description">…</div>
 *             <a class="tab_info-content_link" …>label<div class="md-link-arrow">…</div></a>
 *           </div>
 *           <img class="tab_info-image" …>
 *         </div></div>
 *       </div>
 *     </div></div>
 *   </div>
 *
 * Behaviour: on desktop the panels are absolutely positioned under the button row
 * and the row is given the height of the tallest panel; below 992px it collapses
 * into an accordion. Exactly one tab is open at a time, as in the original.
 */

let uid = 0;

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

function isMobileLayout() {
  return TABLET_MQ.matches;
}

function buildTab(row, index, instance) {
  const [
    nameCell, titleCell, descriptionCell, ctaLabelCell, ctaLinkCell, newTabCell, imageCell,
  ] = [...row.children];

  const item = document.createElement('div');
  item.className = 'tab_item';
  if (index === 0) item.classList.add('active');

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tab_btn-tab';
  button.id = `tab-${instance}-${index}`;
  button.textContent = cellText(nameCell);
  button.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
  button.setAttribute('aria-controls', `tabpanel-${instance}-${index}`);
  const chevron = document.createElement('span');
  chevron.className = 'icon icon-chevron-down tab_btn-icon';
  chevron.setAttribute('aria-hidden', 'true');
  button.append(chevron);

  const container = document.createElement('div');
  container.className = 'tab_info-container';
  container.id = `tabpanel-${instance}-${index}`;
  container.setAttribute('role', 'region');
  container.setAttribute('aria-labelledby', button.id);

  const info = document.createElement('div');
  info.className = 'tab_info';

  const content = document.createElement('div');
  content.className = 'tab_info-content';

  const title = cellText(titleCell);
  if (title) {
    const heading = document.createElement('h3');
    heading.className = 'tab_info-content_header';
    heading.textContent = title;
    moveInstrumentation(titleCell, heading);
    content.append(heading);
  }

  const description = descriptionCell ? descriptionCell.innerHTML.trim() : '';
  if (description) {
    const desc = document.createElement('div');
    desc.className = 'tab_info-content_description';
    desc.innerHTML = description;
    if (!desc.querySelector('p, ul, ol')) {
      const p = document.createElement('p');
      p.innerHTML = description;
      desc.replaceChildren(p);
    }
    moveInstrumentation(descriptionCell, desc);
    content.append(desc);
  }

  const ctaLink = ctaLinkCell ? ctaLinkCell.querySelector('a[href]') : null;
  const href = ctaLink ? ctaLink.getAttribute('href') : cellText(ctaLinkCell);
  const ctaLabel = cellText(ctaLabelCell) || (ctaLink ? ctaLink.textContent.trim() : '');
  if (href && ctaLabel) {
    const anchor = document.createElement('a');
    anchor.className = 'tab_info-content_link';
    anchor.href = href;
    anchor.target = /^(true|yes|on|1)$/i.test(cellText(newTabCell)) ? '_blank' : '_self';
    if (anchor.target === '_blank') anchor.rel = 'noopener';
    anchor.append(document.createTextNode(ctaLabel));
    const arrow = document.createElement('div');
    arrow.className = 'md-link-arrow';
    const icon = document.createElement('span');
    icon.className = 'icon icon-chevron-right';
    icon.setAttribute('aria-hidden', 'true');
    arrow.append(icon);
    anchor.append(arrow);
    content.append(anchor);
  }

  info.append(content);

  const image = imageCell ? imageCell.querySelector('img') : null;
  if (image) {
    const picture = createOptimizedPicture(image.src, image.alt || '', false, [{ width: '900' }]);
    const img = picture.querySelector('img');
    img.className = 'tab_info-image';
    moveInstrumentation(image, img);
    info.append(picture.querySelector('img'));
  }

  container.append(info);
  item.append(button, container);
  moveInstrumentation(row, item);
  return item;
}

export default function decorate(block) {
  uid += 1;
  const instance = uid;

  const rows = [...block.children];
  const configRow = rows.shift();
  const configCells = configRow ? [...configRow.children] : [];
  const mainTitleCell = configCells[0];
  const anchorId = cellText(configCells[1]);
  const noTopPadding = /^(true|yes|on|1)$/i.test(cellText(configCells[2]));
  const noBottomPadding = /^(true|yes|on|1)$/i.test(cellText(configCells[3]));

  const children = [];

  const mainTitle = cellText(mainTitleCell);
  if (mainTitle) {
    const wrapper = document.createElement('div');
    wrapper.className = 'section-title';
    const heading = mainTitleCell.querySelector('h1, h2, h3, h4, h5, h6') || document.createElement('h2');
    if (!heading.isConnected) heading.textContent = mainTitle;
    heading.classList.add('text-center');
    moveInstrumentation(mainTitleCell, heading);
    wrapper.append(heading);
    children.push(wrapper);
  }

  const tabList = document.createElement('div');
  tabList.className = 'tab_list';
  const items = rows.map((row, i) => buildTab(row, i, instance));
  tabList.append(...items);

  const grid = document.createElement('div');
  grid.className = 'grid';
  grid.append(tabList);
  children.push(grid);

  block.classList.add('md', 'md-accordion-tabs');
  if (anchorId) block.id = anchorId;
  if (noTopPadding) block.classList.add('no-top-padding');
  if (noBottomPadding) block.classList.add('no-bottom-padding');
  block.replaceChildren(...children);

  decorateIcons(block);

  /* --- layout: absolutely positioned panels on desktop ------------------- */

  function setMaxHeight() {
    block.classList.add('tabs-initialized');
    tabList.style.height = 'auto';

    let maxHeight = 0;
    items.forEach((item) => {
      const container = item.querySelector('.tab_info-container');
      const button = item.querySelector('.tab_btn-tab');
      // measure every panel, not just the open one
      const wasHidden = getComputedStyle(container).display === 'none';
      if (wasHidden) {
        container.style.visibility = 'hidden';
        container.style.display = 'block';
      }
      maxHeight = Math.max(maxHeight, container.offsetHeight);
      container.style.setProperty('--buttonHeight', `${Math.abs(button.offsetHeight)}px`);
      if (wasHidden) {
        container.style.display = '';
        container.style.visibility = '';
      }
    });

    if (!isMobileLayout()) {
      tabList.style.height = `${tabList.offsetHeight + maxHeight}px`;
    } else {
      tabList.style.height = '';
    }
  }

  function activate(item) {
    items.forEach((candidate) => {
      const isTarget = candidate === item;
      candidate.classList.toggle('active', isTarget);
      candidate
        .querySelector('.tab_btn-tab')
        .setAttribute('aria-expanded', String(isTarget));
    });
  }

  items.forEach((item) => {
    item.querySelector('.tab_btn-tab').addEventListener('click', (event) => {
      event.preventDefault();
      if (isMobileLayout() && item.classList.contains('active')) {
        // on mobile the open panel collapses again
        item.classList.remove('active');
        item.querySelector('.tab_btn-tab').setAttribute('aria-expanded', 'false');
        return;
      }
      activate(item);
    });
  });

  // the block is still `display: none` while it is decorated, so measure later
  whenMeasurable(block, setMaxHeight);
  onWidthChange(setMaxHeight);
  block.querySelectorAll('img').forEach((img) => {
    if (!img.complete) img.addEventListener('load', setMaxHeight, { once: true });
  });
}
