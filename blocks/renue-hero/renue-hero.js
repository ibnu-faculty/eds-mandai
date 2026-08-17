import { moveInstrumentation } from '../../scripts/scripts.js';
import { loadRenueTheme, optimizePicture } from '../../scripts/renue.js';

/*
 * Re:Nue Hero (carousel).
 *
 * Cell layout, as emitted by the xwalk renderer:
 *   row 0                     the container's own `autoplayInterval` field
 *   row 1..n, one per slide    [image, eyebrow, heading, cta] as CELLS
 *
 * Repeatable children use the `core/franklin/components/block/v1/block/item`
 * resource type, which renders each item as a plain row inside this block —
 * NOT as a nested block with its own class. So the slides are built here from
 * their cells (same pattern as blocks/feature-carousel/feature-carousel.js),
 * and `moveInstrumentation` carries the data-aue-* attributes across so every
 * field stays click-to-edit in Universal Editor.
 *
 * Slide-switching mechanics (indicators, prev/next buttons, active-slide
 * tracking via IntersectionObserver, scroll-snap track) are adapted from
 * Adobe's aem-block-collection carousel block
 * (https://www.aem.live/developer/block-collection/carousel), reworked so
 * each slide renders as a full-bleed image background with centered copy
 * (matching the Figma hero) rather than the collection's side-by-side
 * image/content layout.
 *
 * Authoring a second slide automatically turns on the carousel controls
 * below — no code change needed.
 */

// number of leading rows that belong to this block rather than to a slide
const CONTAINER_ROWS = 1;

let heroInstance = 0;

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

/**
 * Builds one slide from its authored row.
 * @param {Element} row The item row
 * @param {boolean} isFirstSlide Whether this is the first slide on the page
 * @returns {Element} The slide element
 */
function buildSlide(row, isFirstSlide) {
  const [imageCell, eyebrowCell, headingCell, ctaCell] = [...row.children];

  const slide = document.createElement('div');
  slide.className = 'renue-hero__slide';

  const picture = imageCell ? imageCell.querySelector('picture') : null;
  if (picture) {
    // Eager + a wide breakpoint set: when this hero is the page's first
    // section, its first slide is the LCP candidate — scripts/scripts.js
    // awaits that section's images in loadEager().
    optimizePicture(picture, { eager: isFirstSlide });
    const img = picture.querySelector('img');
    if (img && img.src) slide.style.backgroundImage = `url('${img.src}')`;
    // Keep the original picture in the DOM (off-screen) so Universal Editor
    // still finds an editable image reference on the page.
    picture.classList.add('renue-hero__source-image');
    slide.append(picture);
  }

  const body = document.createElement('div');
  body.className = 'renue-hero__body';

  if (cellText(eyebrowCell)) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'renue-hero__eyebrow';
    eyebrow.textContent = cellText(eyebrowCell);
    moveInstrumentation(eyebrowCell, eyebrow);
    body.append(eyebrow);
  }

  if (cellText(headingCell)) {
    // Only the first slide's heading is an <h1> (one per page); later slides
    // use <h2> so a multi-slide hero doesn't produce several <h1>s.
    const heading = document.createElement(isFirstSlide ? 'h1' : 'h2');
    heading.className = 'renue-hero__headline';
    heading.textContent = cellText(headingCell);
    moveInstrumentation(headingCell, heading);
    body.append(heading);
  }

  const cta = ctaCell ? ctaCell.querySelector('a[href]') : null;
  if (cta) {
    cta.className = 'renue-btn renue-btn--white';
    body.append(cta);
  }

  slide.append(body);
  moveInstrumentation(row, slide);
  return slide;
}

export default async function decorate(block) {
  await loadRenueTheme();

  heroInstance += 1;
  const instanceId = heroInstance;

  const rows = [...block.children];
  const autoplayInterval = parseInt(cellText(rows[0]), 10) || 0;
  const slides = rows.slice(CONTAINER_ROWS).map((row, idx) => buildSlide(row, idx === 0));

  block.innerHTML = '';

  const track = document.createElement('div');
  track.className = 'renue-hero__track';
  track.setAttribute('role', 'region');
  track.setAttribute('aria-roledescription', 'Carousel');
  track.id = `renue-hero-carousel-${instanceId}`;

  const list = document.createElement('ul');
  list.className = 'renue-hero__slides';
  slides.forEach((slide, idx) => {
    const li = document.createElement('li');
    li.className = 'renue-hero__slide-wrapper';
    li.dataset.slideIndex = idx;
    li.id = `renue-hero-carousel-${instanceId}-slide-${idx}`;
    li.append(slide);
    list.append(li);
  });
  track.append(list);
  block.append(track);

  if (slides.length < 2) return;

  const navButtons = document.createElement('div');
  navButtons.className = 'renue-hero__nav-buttons';
  navButtons.innerHTML = `
    <button type="button" class="renue-hero__prev" aria-label="Previous slide"></button>
    <button type="button" class="renue-hero__next" aria-label="Next slide"></button>
  `;
  track.append(navButtons);

  const pagination = document.createElement('nav');
  pagination.className = 'renue-hero__pagination';
  pagination.setAttribute('aria-label', 'Slide controls');
  const dots = document.createElement('ol');
  slides.forEach((_, idx) => {
    const dot = document.createElement('li');
    dot.dataset.targetSlide = idx;
    dot.innerHTML = `<button type="button" class="renue-hero__dot" aria-label="Show slide ${idx + 1} of ${slides.length}"></button>`;
    dots.append(dot);
  });
  pagination.append(dots);
  block.append(pagination);

  function showSlide(index) {
    let real = index;
    if (real < 0) real = slides.length - 1;
    if (real >= slides.length) real = 0;
    const target = list.children[real];
    list.scrollTo({ top: 0, left: target.offsetLeft, behavior: 'smooth' });
  }

  function updateActive(index) {
    block.dataset.activeSlide = index;
    pagination.querySelectorAll('button').forEach((btn, idx) => {
      const isActive = idx === index;
      btn.classList.toggle('is-active', isActive);
      if (isActive) btn.setAttribute('aria-current', 'true');
      else btn.removeAttribute('aria-current');
    });
  }

  pagination.querySelectorAll('li').forEach((li) => {
    li.querySelector('button').addEventListener('click', () => showSlide(parseInt(li.dataset.targetSlide, 10)));
  });
  track.querySelector('.renue-hero__prev').addEventListener('click', () => {
    showSlide(parseInt(block.dataset.activeSlide || '0', 10) - 1);
  });
  track.querySelector('.renue-hero__next').addEventListener('click', () => {
    showSlide(parseInt(block.dataset.activeSlide || '0', 10) + 1);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) updateActive(parseInt(entry.target.dataset.slideIndex, 10));
      });
    },
    { root: list, threshold: 0.6 },
  );
  [...list.children].forEach((li) => observer.observe(li));
  updateActive(0);

  if (autoplayInterval > 0) {
    setInterval(() => {
      showSlide(parseInt(block.dataset.activeSlide || '0', 10) + 1);
    }, autoplayInterval);
  }
}
