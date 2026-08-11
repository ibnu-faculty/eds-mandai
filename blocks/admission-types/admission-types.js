import { moveInstrumentation } from '../../scripts/scripts.js';
import { decorateIcons, isTrue } from '../../scripts/site.js';

/*
 * Ports wrs/components/commons/admissiontypeswidget.
 *
 * Each authored row is one admission type: [title, link, open in new tab, description].
 *
 * Reproduces the HTL output:
 *   <div class="md md-admission-type bg-sap-white"><div class="grid">
 *     <div class="md-admission-type__wrapper">
 *       <div class="md-admission-type__list">
 *         <div class="md-admission-type__item">
 *           <div class="md-admission-type__title">
 *             <a href=…><p><strong>title <i class="far fa-chevron-right"></i></strong></p></a>
 *           </div>
 *           <div class="md-admission-type__desc"><p>description</p></div>
 *         </div>
 *       </div>
 *     </div>
 *   </div></div>
 */

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

function buildItem(row) {
  const [titleCell, linkCell, newTabCell, descriptionCell] = [...row.children];
  const title = cellText(titleCell);
  const description = descriptionCell ? descriptionCell.innerHTML.trim() : '';
  if (!title && !description) return null;

  const item = document.createElement('div');
  item.className = 'md-admission-type__item';

  if (title) {
    const titleWrapper = document.createElement('div');
    titleWrapper.className = 'md-admission-type__title';

    const strong = document.createElement('strong');
    strong.append(document.createTextNode(`${title} `));
    const chevron = document.createElement('span');
    chevron.className = 'icon icon-chevron-right';
    chevron.setAttribute('aria-hidden', 'true');
    strong.append(chevron);

    const paragraph = document.createElement('p');
    paragraph.append(strong);

    const link = linkCell ? linkCell.querySelector('a[href]') : null;
    const href = link ? link.getAttribute('href') : cellText(linkCell);
    if (href) {
      const anchor = document.createElement('a');
      anchor.href = href;
      if (isTrue(cellText(newTabCell))) {
        anchor.target = '_blank';
        anchor.rel = 'noopener';
      }
      anchor.append(paragraph);
      titleWrapper.append(anchor);
    } else {
      titleWrapper.append(paragraph);
    }

    moveInstrumentation(titleCell, titleWrapper);
    item.append(titleWrapper);
  }

  if (description) {
    const desc = document.createElement('div');
    desc.className = 'md-admission-type__desc';
    desc.innerHTML = description;
    if (!desc.querySelector('p')) {
      const paragraph = document.createElement('p');
      paragraph.innerHTML = description;
      desc.replaceChildren(paragraph);
    }
    moveInstrumentation(descriptionCell, desc);
    item.append(desc);
  }

  moveInstrumentation(row, item);
  return item;
}

export default function decorate(block) {
  const list = document.createElement('div');
  list.className = 'md-admission-type__list';

  [...block.children].forEach((row) => {
    const item = buildItem(row);
    if (item) list.append(item);
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'md-admission-type__wrapper';
  wrapper.append(list);

  const grid = document.createElement('div');
  grid.className = 'grid';
  grid.append(wrapper);

  block.classList.add('md', 'md-admission-type', 'bg-sap-white');
  block.replaceChildren(grid);
  decorateIcons(block);
}
