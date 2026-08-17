import { decorateBlock, loadBlock } from '../../scripts/aem.js';
import { loadRenueTheme } from '../../scripts/renue.js';

/*
 * Re:Nue Hero (carousel) container. Field order (see _renue-hero.json
 * "renue-hero" model): autoplayInterval. Repeatable `renue-hero-slide`
 * children carry the actual per-slide content (image/eyebrow/heading/cta) —
 * see blocks/renue-hero-slide/renue-hero-slide.js. Same container/child +
 * explicit decorateBlock/loadBlock pattern as
 * blocks/renue-stats/renue-stats.js and
 * blocks/renue-accordion/renue-accordion.js — see the comment there for why
 * nested children need this instead of relying on the top-level
 * decorateBlocks() scan.
 *
 * Slide-switching mechanics (indicators, prev/next buttons, active-slide
 * tracking via IntersectionObserver, scroll-snap track) are adapted from
 * Adobe's aem-block-collection carousel block
 * (https://www.aem.live/developer/block-collection/carousel), reworked so
 * each slide renders as a full-bleed image background with centered copy
 * (matching the Figma hero) rather than the collection's side-by-side
 * image/content layout.
 *
 * Only one slide is confirmed from Figma today; authoring a second
 * `renue-hero-slide` automatically turns on the carousel controls below — no
 * code change needed.
 */
let heroInstance = 0;

export default async function decorate(block) {
  await loadRenueTheme();

  heroInstance += 1;
  const instanceId = heroInstance;

  const [autoplayRow] = [...block.children].filter((el) => !el.classList.contains('renue-hero-slide'));
  const autoplayInterval = parseInt(autoplayRow?.textContent?.trim(), 10) || 0;

  const slides = [...block.querySelectorAll(':scope > .renue-hero-slide')];
  slides.forEach(decorateBlock);
  await Promise.all(slides.map(loadBlock));

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

  const isSingleSlide = slides.length < 2;
  if (isSingleSlide) return;

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
