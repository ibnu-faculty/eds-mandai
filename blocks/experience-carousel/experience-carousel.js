import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import createCarousel from '../../scripts/carousel.js';
import { decorateIcons, isTrue } from '../../scripts/site.js';

/*
 * Ports wrs/components/mandai/mandaiexperiencecarouselfeature.
 *
 * Row 1 is the configuration:
 *   [card placement (left|right), card title, card description, cta link,
 *    open in new tab, no top padding, no bottom padding, aria label]
 * Every later row is a slide:
 *   [image, link, open in new tab, title, sub text, disable gradient]
 *
 * Reproduces the HTL output:
 *   <div class="md md-feature-carousel-experience"><div class="grid">
 *     <div class="md-feature-carousel__wrapper">
 *       <div class="md-feature-carousel__title-block">
 *         <a class="title-content" href=…>
 *           <div class="md-link-with-arrow"><h4 class="header">…</h4>
 *             <div class="md-link-arrow">…</div></div>
 *           <div class="description">…</div>
 *         </a>
 *       </div>
 *       <div class="md-feature-carousel__list" data-md-carousel …>
 *         <div class="md-feature-carousel__container">
 *           <a href=…><div class="md-feature-carousel__item text-gradient">
 *             <div class="md-feature-carousel__img"><img …></div>
 *             <div class="md-feature-carousel__content"><div class="feature-content">
 *               <div class="feature-content-inner">
 *                 <h4 class="title text-sap-white">…</h4>
 *                 <div class="body-text1"><p class="text-sap-white">…</p></div>
 *               </div>
 *             </div></div>
 *           </div></a>
 *         </div>
 *       </div>
 *     </div>
 *   </div></div>
 *
 * The `right` placement puts the card after the carousel and runs the track
 * right-to-left, as the original did with `data-rtl`.
 */

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

function buildSlide(row) {
  const [imageCell, linkCell, newTabCell, titleCell, subTextCell, disableGradientCell] = [
    ...row.children,
  ];

  const item = document.createElement('div');
  item.className = 'md-feature-carousel__item';
  if (!isTrue(cellText(disableGradientCell))) item.classList.add('text-gradient');

  const image = imageCell ? imageCell.querySelector('img') : null;
  if (image) {
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'md-feature-carousel__img';
    const picture = createOptimizedPicture(image.src, image.alt || '', false, [{ width: '900' }]);
    moveInstrumentation(image, picture.querySelector('img'));
    imgWrapper.append(picture);
    item.append(imgWrapper);
  }

  const title = cellText(titleCell);
  const subText = subTextCell ? subTextCell.innerHTML.trim() : '';
  if (title || subText) {
    const inner = document.createElement('div');
    inner.className = 'feature-content-inner';
    if (title) {
      const heading = document.createElement('h4');
      heading.className = 'title text-sap-white';
      heading.textContent = title;
      moveInstrumentation(titleCell, heading);
      inner.append(heading);
    }
    if (subText) {
      const body = document.createElement('div');
      body.className = 'body-text1';
      body.innerHTML = subText;
      if (!body.querySelector('p')) {
        const p = document.createElement('p');
        p.innerHTML = subText;
        body.replaceChildren(p);
      }
      body.querySelectorAll('p').forEach((p) => p.classList.add('text-sap-white'));
      moveInstrumentation(subTextCell, body);
      inner.append(body);
    }

    const featureContent = document.createElement('div');
    featureContent.className = 'feature-content';
    featureContent.append(inner);

    const content = document.createElement('div');
    content.className = 'md-feature-carousel__content';
    content.append(featureContent);
    item.append(content);
  }

  const container = document.createElement('div');
  container.className = 'md-feature-carousel__container';

  const link = linkCell ? linkCell.querySelector('a[href]') : null;
  const href = link ? link.getAttribute('href') : cellText(linkCell);
  if (href) {
    const anchor = document.createElement('a');
    anchor.href = href;
    if (isTrue(cellText(newTabCell))) {
      anchor.target = '_blank';
      anchor.rel = 'noopener';
    }
    if (title) anchor.setAttribute('aria-label', title);
    anchor.append(item);
    container.append(anchor);
  } else {
    const plain = document.createElement('div');
    plain.append(item);
    container.append(plain);
  }

  moveInstrumentation(row, container);
  return container;
}

export default function decorate(block) {
  const rows = [...block.children];
  const configRow = rows.shift();
  const configCells = configRow ? [...configRow.children] : [];
  const placement = cellText(configCells[0]) === 'right' ? 'right' : 'left';
  const cardTitleCell = configCells[1];
  const cardDescriptionCell = configCells[2];
  const ctaLinkCell = configCells[3];
  const openNewTab = isTrue(cellText(configCells[4]));
  const noTopPadding = isTrue(cellText(configCells[5]));
  const noBottomPadding = isTrue(cellText(configCells[6]));
  const ariaLabel = cellText(configCells[7]);

  /* --- the title card ---------------------------------------------------- */

  const ctaLink = ctaLinkCell ? ctaLinkCell.querySelector('a[href]') : null;
  const ctaHref = ctaLink ? ctaLink.getAttribute('href') : cellText(ctaLinkCell);

  const titleContent = document.createElement(ctaHref ? 'a' : 'div');
  titleContent.className = 'title-content';
  if (ctaHref) {
    titleContent.href = ctaHref;
    if (openNewTab) {
      titleContent.target = '_blank';
      titleContent.rel = 'noopener';
    }
  }

  const linkWithArrow = document.createElement('div');
  linkWithArrow.className = 'md-link-with-arrow';
  const cardTitle = cellText(cardTitleCell);
  const header = cardTitleCell
    ? cardTitleCell.querySelector('h1, h2, h3, h4, h5, h6')
    : null;
  const headerEl = header || document.createElement('h4');
  if (!header) headerEl.textContent = cardTitle;
  headerEl.classList.add('header');
  moveInstrumentation(cardTitleCell, headerEl);
  linkWithArrow.append(headerEl);

  if (ctaHref) {
    const arrow = document.createElement('div');
    arrow.className = 'md-link-arrow';
    const icon = document.createElement('span');
    icon.className = 'icon icon-chevron-right';
    icon.setAttribute('aria-hidden', 'true');
    arrow.append(icon);
    linkWithArrow.append(arrow);
  }
  titleContent.append(linkWithArrow);

  const cardDescription = cardDescriptionCell ? cardDescriptionCell.innerHTML.trim() : '';
  if (cardDescription) {
    const description = document.createElement('div');
    description.className = 'description';
    description.innerHTML = cardDescription;
    moveInstrumentation(cardDescriptionCell, description);
    titleContent.append(description);
  }

  const titleBlock = document.createElement('div');
  titleBlock.className = 'md-feature-carousel__title-block';
  titleBlock.append(titleContent);

  /* --- the carousel ------------------------------------------------------ */

  const track = document.createElement('div');
  track.className = 'md-feature-carousel__list';
  rows.forEach((row) => track.append(buildSlide(row)));

  const wrapper = document.createElement('div');
  wrapper.className = 'md-feature-carousel__wrapper';
  if (placement === 'right') {
    wrapper.classList.add('md-feature-carousel__wrapper--title-right');
    wrapper.append(track, titleBlock);
  } else {
    wrapper.append(titleBlock, track);
  }

  const grid = document.createElement('div');
  grid.className = 'grid';
  grid.append(wrapper);

  block.classList.add('md', 'md-feature-carousel-experience');
  if (noTopPadding) block.classList.add('no-top-padding');
  if (noBottomPadding) block.classList.add('no-bottom-padding');
  block.replaceChildren(grid);

  createCarousel(track, {
    slidesToShowDesktop: 1,
    slidesToShowTablet: 1,
    slidesToShowMobile: 1,
    infinite: true,
    autoplay: false,
    dots: true,
    arrows: true,
    rtl: placement === 'right',
    skipSingleSlide: true,
    arrowIcons: ['chevron-left', 'chevron-right'],
    label: ariaLabel || 'Carousel track with interactive elements',
  });

  decorateIcons(block);
}
