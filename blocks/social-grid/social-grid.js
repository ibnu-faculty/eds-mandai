import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/site.js';

/*
 * Ports wrs/components/mandai/mandaisocialcontentgrid.
 *
 * Row 1 is the heading tile, every later row is a feed entry:
 *   [image, social network, handle, post url, message]
 *
 * Reproduces the HTL output:
 *   <div class="md social-grid-component">
 *     <div class="social-grid-component__column main">
 *       <div class="social-grid-component__title"><h3>title</h3></div>
 *     </div>
 *     <div class="social-grid-component__column photo">
 *       <a href=… target="_blank">
 *         <div class="social-grid-component__username">
 *           <i class="fab fa-instagram"></i><div class="body-text2">handle</div>
 *         </div>
 *         <img …>
 *       </a>
 *     </div>
 *   </div>
 *
 * A row without an image renders the `twitter` (text) variant, matching the
 * original component's branching.
 */

const NETWORK_ICONS = {
  instagram: 'instagram',
  facebook: 'facebook',
  tiktok: 'tiktok',
  youtube: 'youtube-play',
  linkedin: 'linkedin',
  weixin: 'weixin',
  wechat: 'weixin',
};

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

function buildUsername(network, handle) {
  if (!handle) return null;
  const username = document.createElement('div');
  username.className = 'social-grid-component__username';

  const iconName = NETWORK_ICONS[network.toLowerCase()];
  if (iconName) {
    const icon = document.createElement('span');
    icon.className = `icon icon-${iconName}`;
    icon.setAttribute('aria-hidden', 'true');
    username.append(icon);
  }

  const label = document.createElement('div');
  label.className = 'body-text2';
  label.textContent = handle;
  username.append(label);
  return username;
}

function buildTile(row) {
  const [imageCell, networkCell, handleCell, urlCell, messageCell] = [...row.children];
  const image = imageCell ? imageCell.querySelector('img') : null;
  const network = cellText(networkCell);
  const handle = cellText(handleCell);
  const link = urlCell ? urlCell.querySelector('a[href]') : null;
  const href = link ? link.getAttribute('href') : cellText(urlCell);
  const message = messageCell ? messageCell.innerHTML.trim() : '';

  const column = document.createElement('div');
  column.className = `social-grid-component__column ${image ? 'photo' : 'twitter'}`;

  const content = [];
  if (!image && message) {
    const title = document.createElement('div');
    title.className = 'social-grid-component__title';
    const heading = document.createElement('h4');
    heading.innerHTML = message;
    title.append(heading);
    content.push(title);
  }

  const username = buildUsername(network, handle);
  if (username) content.push(username);

  if (image) {
    const picture = createOptimizedPicture(image.src, image.alt || '', false, [{ width: '750' }]);
    moveInstrumentation(image, picture.querySelector('img'));
    content.push(picture);
  }

  if (href) {
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.target = '_blank';
    anchor.rel = 'noopener';
    if (handle) anchor.setAttribute('aria-label', `${handle} on ${network || 'social media'}`);
    anchor.append(...content);
    column.append(anchor);
  } else {
    column.append(...content);
  }

  moveInstrumentation(row, column);
  return column;
}

export default function decorate(block) {
  const rows = [...block.children];
  const headingRow = rows.shift();

  const columns = [];

  if (headingRow) {
    const main = document.createElement('div');
    main.className = 'social-grid-component__column main';
    const title = document.createElement('div');
    title.className = 'social-grid-component__title';
    const heading = headingRow.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      title.append(heading);
    } else {
      const h3 = document.createElement('h3');
      h3.textContent = headingRow.textContent.trim();
      title.append(h3);
    }
    main.append(title);
    moveInstrumentation(headingRow, main);
    columns.push(main);
  }

  rows.forEach((row) => columns.push(buildTile(row)));

  block.classList.add('md', 'social-grid-component');
  block.replaceChildren(...columns);
  decorateIcons(block);
}
