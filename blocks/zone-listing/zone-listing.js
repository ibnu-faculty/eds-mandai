import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import {
  decorateIcons, isMobile, MOBILE_MQ, onMediaChange,
} from '../../scripts/site.js';

/*
 * Ports wrs/components/commons/featuredlistingv2 together with its show-all.js
 * plugin.
 *
 * Row 1 is the configuration: [anchor id, minimum items on mobile,
 * "view all" label, "view less" label]. Every later row is one tile:
 * [image (3:2 desktop / 1:1 mobile), link, heading, description].
 *
 * Reproduces the HTL output:
 *   <div class="md wrapper-feature-listing" id="zones">
 *     <div class="list-animals">
 *       <div class="animals-item">
 *         <a class="wrapp-img" href=…>
 *           <img …>
 *           <div class="desc rich-text"><h4>…</h4><p>…</p></div>
 *         </a>
 *       </div>
 *       <div class="wrapp-btn hide-desktop"><button class="btn btn-secondary">…</button></div>
 *     </div>
 *   </div>
 */

const DEFAULT_MIN = 6;

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

function buildTile(row) {
  const [imageCell, linkCell, headingCell, descriptionCell] = [...row.children];
  const images = imageCell ? [...imageCell.querySelectorAll('img')] : [];
  const [desktopImage, mobileImage] = images;
  const heading = cellText(headingCell);
  const description = descriptionCell ? descriptionCell.innerHTML.trim() : '';
  const link = linkCell ? linkCell.querySelector('a[href]') : null;
  const href = link ? link.getAttribute('href') : cellText(linkCell);

  const item = document.createElement('div');
  item.className = 'animals-item';

  const content = [];

  if (desktopImage) {
    const picture = createOptimizedPicture(
      desktopImage.src,
      desktopImage.alt || heading,
      false,
      [{ media: '(max-width: 1023px)', width: '512' }, { width: '720' }],
    );
    // the original swapped to a 1:1 crop below 1024px via image-mobile.js
    if (mobileImage) {
      const source = document.createElement('source');
      source.media = '(max-width: 1023px)';
      source.srcset = mobileImage.src;
      picture.prepend(source);
    }
    moveInstrumentation(desktopImage, picture.querySelector('img'));
    content.push(picture);
  }

  if (heading || description) {
    const desc = document.createElement('div');
    desc.className = 'desc rich-text';
    if (heading) {
      const h4 = document.createElement('h4');
      h4.textContent = heading;
      if (href) {
        const chevron = document.createElement('span');
        chevron.className = 'icon icon-chevron-right';
        chevron.setAttribute('aria-hidden', 'true');
        h4.append(chevron);
      }
      moveInstrumentation(headingCell, h4);
      desc.append(h4);
    }
    if (description) {
      const body = document.createElement('div');
      body.innerHTML = description;
      if (!body.querySelector('p')) {
        const p = document.createElement('p');
        p.innerHTML = description;
        body.replaceChildren(p);
      }
      moveInstrumentation(descriptionCell, body);
      desc.append(...body.childNodes);
    }
    content.push(desc);
  }

  const wrapper = document.createElement(href ? 'a' : 'div');
  wrapper.className = 'wrapp-img';
  if (href) wrapper.href = href;
  wrapper.append(...content);
  item.append(wrapper);

  moveInstrumentation(row, item);
  return item;
}

/** show-all.js — on mobile only the first `min` tiles are shown until expanded */
function setupShowAll(list, items, min, showLabel, hideLabel) {
  if (items.length <= min) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'wrapp-btn hide-desktop';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-secondary';
  button.textContent = showLabel;
  button.setAttribute('aria-expanded', 'false');
  wrapper.append(button);
  list.append(wrapper);

  const overflow = items.slice(min);
  let expanded = false;

  const render = () => {
    const collapse = isMobile() && !expanded;
    overflow.forEach((item) => item.classList.toggle('hidden-xs', collapse));
    button.textContent = expanded ? hideLabel : showLabel;
    button.setAttribute('aria-expanded', String(expanded));
  };

  button.addEventListener('click', () => {
    expanded = !expanded;
    render();
  });

  onMediaChange(MOBILE_MQ, () => {
    if (!isMobile()) expanded = false;
    render();
  });
}

export default function decorate(block) {
  const rows = [...block.children];
  const configRow = rows.shift();
  const configCells = configRow ? [...configRow.children] : [];
  const anchorId = cellText(configCells[0]);
  const min = parseInt(cellText(configCells[1]), 10) || DEFAULT_MIN;
  const showLabel = cellText(configCells[2]) || 'View All';
  const hideLabel = cellText(configCells[3]) || 'View Less';

  const list = document.createElement('div');
  list.className = 'list-animals';

  const items = rows.map((row) => buildTile(row));
  list.append(...items);

  block.classList.add('md', 'wrapper-feature-listing');
  if (anchorId) block.id = anchorId;
  block.replaceChildren(list);

  setupShowAll(list, items, min, showLabel, hideLabel);
  decorateIcons(block);
}
