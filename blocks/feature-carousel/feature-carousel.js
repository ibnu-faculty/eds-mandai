import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import createCarousel from '../../scripts/carousel.js';
import { isTrue, responsiveBackground } from '../../scripts/site.js';

/*
 * Ports wrs/components/mandai/mandaifeaturecarousel
 * (color-carousel-template.html / image-carousel-template.html / slide-template.html).
 *
 * Row 1 is the configuration:
 *   [background, background images (desktop, mobile), heading, aria label,
 *    description, anchor id, view-all cta]
 * Every later row is a tile:
 *   [image, link, title, description, gradient, hide]
 *
 * Reproduces the HTL output:
 *   <div class="md md-feature-carousel {bg}" id="…">
 *     <div class="grid">
 *       <h2 class="section-title text-center">…</h2>
 *       <div class="description">…</div>
 *       <div class="row" data-md-carousel slides-to-show-desktop="2" …>
 *         <div class="col-md-6 col-sm-12">
 *           <a href=…>
 *             <div class="md-feature-carousel__column text-gradient">
 *               <div class="md-feature-carousel__img"><img …></div>
 *               <div class="md-feature-carousel__content"><div class="feature-content">
 *                 <div class="feature-content-inner">
 *                   <h3 class="title text-sap-white">…</h3>
 *                   <div class="body-text1"><p class="text-sap-white">…</p></div>
 *                 </div>
 *               </div></div>
 *             </div>
 *           </a>
 *         </div>
 *       </div>
 *       <div class="md-3-col-content-fragment-with-filter-and-cta__button text-center">…</div>
 *     </div>
 *   </div>
 *
 * `bgImage` renders the `bg-custom` variant whose background image swaps at the
 * mobile breakpoint (the AEM background-change.js plugin).
 */

const BACKGROUNDS = ['base', 'bg-base', 'bg-sap-white', 'bg-dark-green', 'bg-custom'];

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

function buildSlide(row) {
  const [imageCell, linkCell, titleCell, descriptionCell, gradientCell, hideCell] = [
    ...row.children,
  ];

  if (isTrue(cellText(hideCell))) return null;

  const column = document.createElement('div');
  column.className = 'md-feature-carousel__column';
  const gradient = cellText(gradientCell);
  if (gradient === 'text-gradient' || isTrue(gradient)) {
    column.classList.add('text-gradient');
  }

  const image = imageCell ? imageCell.querySelector('img') : null;
  if (image) {
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'md-feature-carousel__img';
    const picture = createOptimizedPicture(image.src, image.alt || '', false, [{ width: '900' }]);
    moveInstrumentation(image, picture.querySelector('img'));
    imgWrapper.append(picture);
    column.append(imgWrapper);
  }

  const title = cellText(titleCell);
  const description = descriptionCell ? descriptionCell.innerHTML.trim() : '';
  if (title || description) {
    const inner = document.createElement('div');
    inner.className = 'feature-content-inner';
    if (title) {
      const heading = document.createElement('h3');
      heading.className = 'title text-sap-white';
      heading.textContent = title;
      moveInstrumentation(titleCell, heading);
      inner.append(heading);
    }
    if (description) {
      const body = document.createElement('div');
      body.className = 'body-text1';
      body.innerHTML = description;
      if (!body.querySelector('p')) {
        const p = document.createElement('p');
        p.innerHTML = description;
        body.replaceChildren(p);
      }
      body.querySelectorAll('p').forEach((p) => p.classList.add('text-sap-white'));
      moveInstrumentation(descriptionCell, body);
      inner.append(body);
    }

    const featureContent = document.createElement('div');
    featureContent.className = 'feature-content';
    featureContent.append(inner);

    const content = document.createElement('div');
    content.className = 'md-feature-carousel__content';
    content.append(featureContent);
    column.append(content);
  }

  const link = linkCell ? linkCell.querySelector('a[href]') : null;
  const href = link ? link.getAttribute('href') : cellText(linkCell);

  const slide = document.createElement('div');
  slide.className = 'col-md-6 col-sm-12';
  if (href) {
    const anchor = document.createElement('a');
    anchor.href = href;
    if (link && link.target) anchor.target = link.target;
    if (title) anchor.setAttribute('aria-label', title);
    anchor.append(column);
    slide.append(anchor);
  } else {
    slide.append(column);
  }

  moveInstrumentation(row, slide);
  return slide;
}

export default function decorate(block) {
  const rows = [...block.children];
  const configRow = rows.shift();
  const configCells = configRow ? [...configRow.children] : [];
  const background = cellText(configCells[0]) || 'base';
  const backgroundImages = configCells[1] ? [...configCells[1].querySelectorAll('img')] : [];
  const headingCell = configCells[2];
  const ariaLabel = cellText(configCells[3]);
  const descriptionCell = configCells[4];
  const anchorId = cellText(configCells[5]);
  const viewAllCta = configCells[6] ? configCells[6].querySelector('a[href]') : null;

  const grid = document.createElement('div');
  grid.className = 'grid';

  const heading = cellText(headingCell);
  if (heading) {
    const h2 = headingCell.querySelector('h1, h2, h3, h4, h5, h6') || document.createElement('h2');
    if (!h2.isConnected) h2.textContent = heading;
    h2.classList.add('section-title', 'text-center');
    moveInstrumentation(headingCell, h2);
    grid.append(h2);
  }

  const description = descriptionCell ? descriptionCell.innerHTML.trim() : '';
  if (description) {
    const desc = document.createElement('div');
    desc.className = 'description';
    desc.innerHTML = description;
    moveInstrumentation(descriptionCell, desc);
    grid.append(desc);
  }

  const track = document.createElement('div');
  track.className = 'row';
  rows.forEach((row) => {
    const slide = buildSlide(row);
    if (slide) track.append(slide);
  });
  grid.append(track);

  const ctaWrapper = document.createElement('div');
  ctaWrapper.className = 'md-3-col-content-fragment-with-filter-and-cta__button text-center';
  if (viewAllCta) {
    const anchor = document.createElement('a');
    anchor.href = viewAllCta.getAttribute('href');
    if (viewAllCta.target) anchor.target = viewAllCta.target;
    const span = document.createElement('span');
    span.className = 'md-button';
    span.textContent = viewAllCta.textContent.trim();
    anchor.append(span);
    ctaWrapper.append(anchor);
  }
  grid.append(ctaWrapper);

  const isImageBackground = background === 'bgImage' || background === 'bg-custom';
  block.classList.add('md', 'md-feature-carousel');
  if (isImageBackground) {
    block.classList.add('bg-custom');
  } else {
    block.classList.add(BACKGROUNDS.includes(background) ? background : 'base');
  }
  if (anchorId) block.id = anchorId;
  block.replaceChildren(grid);

  if (isImageBackground) {
    const [desktop, mobile] = backgroundImages;
    responsiveBackground(block, desktop ? desktop.src : '', mobile ? mobile.src : '');
  }

  createCarousel(track, {
    slidesToShowDesktop: 2,
    slidesToShowTablet: 2,
    slidesToShowMobile: 1,
    infinite: true,
    autoplay: false,
    dots: true,
    arrows: true,
    label: ariaLabel || heading || 'Feature carousel',
  });
}
