import { moveInstrumentation } from '../../scripts/scripts.js';
import { isTrue } from '../../scripts/site.js';

/*
 * Ports the conservation banner that wrs/components/structure/footerv2 renders
 * above the footer (the `md-short-masthead-component--v2` variant of
 * wrs/components/commons/shortmasthead).
 *
 * Authored rows:
 *   1. banner images — desktop then mobile
 *   2. title
 *   3. tag image (e.g. the "Conservation Included" lockup)
 *   4. description
 *   5. cta
 *   6. gradient behind the text (true/false)
 *
 * Reproduces the HTL output:
 *   <div class="md md-short-masthead-component md-short-masthead-component--v2 text-on-top">
 *     <div class="short-masthead">
 *       <div class="cover-picture"><img class="desktop"><img class="mobile"></div>
 *       <div class="wrapp-content text-gradient">
 *         <h2 class="text-yellow">…</h2>
 *         <div class="banner-box"><img …></div>
 *         <div class="desc"><p class="text-sap-white">…</p></div>
 *         <a class="md-button-big" href=…>…</a>
 *       </div>
 *     </div>
 *   </div>
 */

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

export default function decorate(block) {
  const rows = [...block.children];
  const [imagesRow, titleRow, tagRow, descriptionRow, ctaRow, gradientRow] = rows;

  const images = imagesRow ? [...imagesRow.querySelectorAll('img')] : [];
  const [desktopImage, mobileImage] = images;

  const cover = document.createElement('div');
  cover.className = 'cover-picture';
  if (desktopImage) {
    desktopImage.classList.add('desktop');
    desktopImage.loading = 'lazy';
    cover.append(desktopImage);
  }
  if (mobileImage) {
    mobileImage.classList.add('mobile');
    mobileImage.loading = 'lazy';
    cover.append(mobileImage);
  }

  const content = document.createElement('div');
  content.className = 'wrapp-content';
  if (isTrue(cellText(gradientRow))) content.classList.add('text-gradient');

  const title = cellText(titleRow);
  if (title) {
    const heading = titleRow.querySelector('h1, h2, h3, h4, h5, h6') || document.createElement('h2');
    if (!heading.isConnected) heading.textContent = title;
    heading.classList.add('text-yellow');
    moveInstrumentation(titleRow, heading);
    content.append(heading);
  }

  const tagImage = tagRow ? tagRow.querySelector('img') : null;
  if (tagImage) {
    const box = document.createElement('div');
    box.className = 'banner-box';
    tagImage.loading = 'lazy';
    box.append(tagImage);
    moveInstrumentation(tagRow, box);
    content.append(box);
  }

  const description = descriptionRow ? descriptionRow.innerHTML.trim() : '';
  if (description && descriptionRow.textContent.trim()) {
    const desc = document.createElement('div');
    desc.className = 'desc';
    desc.innerHTML = descriptionRow.querySelector(':scope > div')
      ? descriptionRow.querySelector(':scope > div').innerHTML
      : description;
    if (!desc.querySelector('p')) {
      const p = document.createElement('p');
      p.innerHTML = desc.innerHTML;
      desc.replaceChildren(p);
    }
    desc.querySelectorAll('p').forEach((p) => p.classList.add('text-sap-white'));
    moveInstrumentation(descriptionRow, desc);
    content.append(desc);
  }

  const cta = ctaRow ? ctaRow.querySelector('a[href]') : null;
  if (cta) {
    const anchor = document.createElement('a');
    anchor.className = 'md-button-big';
    anchor.href = cta.getAttribute('href');
    if (cta.target) anchor.target = cta.target;
    anchor.textContent = cta.textContent.trim();
    content.append(anchor);
  }

  const masthead = document.createElement('div');
  masthead.className = 'short-masthead';
  masthead.append(cover, content);

  block.classList.add(
    'md',
    'md-short-masthead-component',
    'md-short-masthead-component--v2',
    'text-on-top',
  );
  block.replaceChildren(masthead);
}
