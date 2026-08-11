/*
 * Carousel engine that reproduces the slick-carousel behaviour and DOM contract
 * used by the AEM `md-carousel.js` plugin: the same wrapper markup and class
 * names (slick-slider / slick-list / slick-track / slick-slide / slick-active /
 * slick-dots / slick-arrow), the same responsive slidesToShow breakpoints
 * (< 768 mobile, < 992 tablet, otherwise desktop), infinite looping, swipe,
 * optional autoplay with pause on hover/focus, and the same accessibility
 * semantics the plugin applied after every change.
 */

import { pauseMedia, playMedia } from './site.js';

const FOCUSABLE = 'a, button, input, select, textarea, iframe, [tabindex]';

/*
 * slick evaluated its responsive breakpoints against the window width; these
 * media queries are the equivalent, and using them keeps the JS breakpoints and
 * the stylesheet's breakpoints in agreement whatever the window reports.
 */
const MOBILE = window.matchMedia('(max-width: 767px)');
const TABLET = window.matchMedia('(max-width: 991px)');

let uid = 0;

function buildArrow(direction, iconName) {
  const button = document.createElement('button');
  const isPrev = direction === 'prev';
  button.type = 'button';
  button.className = `slick-${isPrev ? 'prev' : 'next'} slick-arrow`;
  button.setAttribute('aria-label', isPrev ? 'Previous' : 'Next');
  if (iconName) {
    const icon = document.createElement('span');
    icon.className = `icon icon-${iconName}`;
    icon.setAttribute('aria-hidden', 'true');
    button.append(icon);
  }
  const label = document.createElement('span');
  label.className = 'visually-hidden';
  label.textContent = isPrev ? 'Previous' : 'Next';
  button.append(label);
  return button;
}

function buildDots(count) {
  const list = document.createElement('ul');
  list.className = 'slick-dots';
  list.setAttribute('role', 'group');
  for (let i = 0; i < count; i += 1) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    // the pill is drawn on the <li>, so the button fills it to stay clickable
    const label = document.createElement('span');
    label.className = 'visually-hidden';
    label.textContent = `Go to slide ${i + 1}`;
    button.append(label);
    li.append(button);
    list.append(li);
  }
  return list;
}

/**
 * Turns `element` into a carousel. Its direct children become the slides.
 *
 * @param {Element} element the carousel container (the old `[data-md-carousel]`)
 * @param {object} options
 * @param {number} [options.slidesToShowDesktop=1]
 * @param {number} [options.slidesToShowTablet=1]
 * @param {number} [options.slidesToShowMobile=1]
 * @param {boolean} [options.infinite=false]
 * @param {boolean} [options.autoplay=false]
 * @param {number} [options.autoplaySpeed=3000]
 * @param {boolean} [options.dots=true]
 * @param {boolean} [options.arrows=true]
 * @param {boolean} [options.rtl=false]
 * @param {boolean} [options.skipSingleSlide=false]
 * @param {string} [options.label='Carousel']
 * @param {number} [options.speed=500] transition duration in ms
 * @returns {object|null} carousel controller, or null when not initialised
 */
export default function createCarousel(element, options = {}) {
  const {
    slidesToShowDesktop = 1,
    slidesToShowTablet = 1,
    slidesToShowMobile = 1,
    infinite = false,
    autoplay = false,
    autoplaySpeed = 3000,
    dots = true,
    arrows = true,
    rtl = false,
    skipSingleSlide = false,
    label = 'Carousel',
    speed = 500,
    arrowIcons = null,
  } = options;

  const slides = [...element.children];
  const total = slides.length;
  if (!total) return null;
  if (skipSingleSlide && total === 1) return null;

  uid += 1;
  const instanceId = uid;

  const list = document.createElement('div');
  list.className = 'slick-list draggable';
  list.setAttribute('role', 'none');

  const track = document.createElement('div');
  track.className = 'slick-track';
  track.setAttribute('role', 'none');
  track.style.transitionDuration = `${speed}ms`;

  list.append(track);

  slides.forEach((slide, i) => {
    slide.classList.add('slick-slide');
    slide.setAttribute('data-slick-index', String(i));
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `slide ${i + 1} of ${total}`);
    slide.id = slide.id || `slick-panel-${instanceId}-${i}`;
  });

  const prevArrow = arrows ? buildArrow('prev', arrowIcons ? arrowIcons[0] : null) : null;
  const nextArrow = arrows ? buildArrow('next', arrowIcons ? arrowIcons[1] : null) : null;
  const dotsList = dots ? buildDots(total) : null;

  element.replaceChildren(
    ...[prevArrow, list, nextArrow, dotsList].filter(Boolean),
  );
  element.classList.add('slick-slider', 'slick-initialized');
  element.setAttribute('role', 'region');
  element.setAttribute('aria-label', label || 'carousel');
  if (rtl) {
    element.classList.add('slick-rtl');
    list.dir = 'rtl';
  }

  element.querySelectorAll('i.fas, i.far, i.fab').forEach((i) => {
    i.setAttribute('aria-hidden', 'true');
  });

  let slidesToShow = 1;
  let looping = false;
  let clonesBefore = [];
  let current = 0; // index into the real slides
  let position = 0; // index into the rendered (cloned + real) track
  let animating = false;
  let rendered = [];

  const sign = rtl ? -1 : 1;

  function trackLength() {
    return rendered.length;
  }

  function layout() {
    const count = trackLength();
    track.style.width = `${(count / slidesToShow) * 100}%`;
    rendered.forEach((slide) => { slide.style.width = `${100 / count}%`; });
  }

  function applyTransform(animate) {
    const count = trackLength();
    const offset = count ? (position / count) * 100 : 0;
    track.style.transitionDuration = animate ? `${speed}ms` : '0ms';
    track.style.transform = `translate3d(${-sign * offset}%, 0, 0)`;
    if (!animate) {
      // force the browser to adopt the jump before re-enabling transitions
      track.getBoundingClientRect();
      track.style.transitionDuration = `${speed}ms`;
    }
  }

  function setFocusable(slide, focusable) {
    slide.querySelectorAll(FOCUSABLE).forEach((el) => {
      if (focusable) {
        const original = el.dataset.originalTabindex;
        if (original !== undefined) el.setAttribute('tabindex', original);
        else el.removeAttribute('tabindex');
        el.removeAttribute('aria-hidden');
      } else {
        const existing = el.getAttribute('tabindex');
        if (existing !== null && existing !== '-1') el.dataset.originalTabindex = existing;
        el.setAttribute('tabindex', '-1');
        el.setAttribute('aria-hidden', 'true');
      }
    });
    slide.setAttribute('aria-hidden', focusable ? 'false' : 'true');
  }

  function syncStates() {
    const active = new Set();
    for (let i = 0; i < slidesToShow; i += 1) active.add(position + i);

    rendered.forEach((slide, i) => {
      const isActive = active.has(i);
      slide.classList.toggle('slick-active', isActive);
      slide.classList.toggle('slick-current', i === position);
      slide.classList.toggle('slick-now', isActive);
      setFocusable(slide, isActive);
      if (isActive) playMedia(slide);
      else pauseMedia(slide);
    });

    if (dotsList) {
      [...dotsList.children].forEach((li, i) => {
        const isCurrent = i === current;
        li.classList.toggle('slick-active', isCurrent);
        const button = li.querySelector('button');
        if (isCurrent) {
          button.setAttribute('aria-current', 'true');
          button.setAttribute('aria-disabled', 'true');
        } else {
          button.removeAttribute('aria-current');
          button.removeAttribute('aria-disabled');
        }
      });
    }

    if (prevArrow && nextArrow) {
      const atStart = !looping && current === 0;
      const atEnd = !looping && current >= total - slidesToShow;
      prevArrow.classList.toggle('slick-disabled', atStart);
      nextArrow.classList.toggle('slick-disabled', atEnd);
      prevArrow.setAttribute('aria-disabled', String(atStart));
      nextArrow.setAttribute('aria-disabled', String(atEnd));
      const showArrows = total > slidesToShow;
      prevArrow.hidden = !showArrows;
      nextArrow.hidden = !showArrows;
    }
  }

  function build() {
    let target = slidesToShowDesktop;
    if (MOBILE.matches) target = slidesToShowMobile;
    else if (TABLET.matches) target = slidesToShowTablet;
    slidesToShow = Math.max(1, Math.min(target, total));
    looping = infinite && total > slidesToShow;

    if (looping) {
      const cloneCount = Math.min(slidesToShow + 1, total);
      clonesBefore = slides.slice(total - cloneCount).map((slide) => {
        const clone = slide.cloneNode(true);
        clone.classList.add('slick-cloned');
        clone.removeAttribute('id');
        clone.setAttribute('aria-hidden', 'true');
        return clone;
      });
      const clonesAfter = slides.slice(0, cloneCount).map((slide) => {
        const clone = slide.cloneNode(true);
        clone.classList.add('slick-cloned');
        clone.removeAttribute('id');
        clone.setAttribute('aria-hidden', 'true');
        return clone;
      });
      rendered = [...clonesBefore, ...slides, ...clonesAfter];
    } else {
      clonesBefore = [];
      rendered = [...slides];
    }

    track.replaceChildren(...rendered);
    if (dotsList) {
      element.classList.toggle('slick-dotted', total > slidesToShow);
      dotsList.hidden = total <= slidesToShow;
    }

    current = Math.min(current, looping ? total - 1 : Math.max(0, total - slidesToShow));
    position = clonesBefore.length + current;
    layout();
    applyTransform(false);
    syncStates();
  }

  function goTo(target, isDelta) {
    if (animating) return;
    let nextReal;
    if (isDelta) {
      nextReal = current + target;
      if (!looping) {
        const max = Math.max(0, total - slidesToShow);
        nextReal = Math.min(Math.max(nextReal, 0), max);
      }
    } else {
      nextReal = target;
    }
    if (!looping && nextReal === current) return;

    const steps = nextReal - current;
    if (!steps) return;

    current = looping ? ((nextReal % total) + total) % total : nextReal;
    position += steps;
    animating = true;
    applyTransform(true);
    syncStates();
  }

  track.addEventListener('transitionend', (e) => {
    if (e.target !== track || e.propertyName !== 'transform') return;
    animating = false;
    if (!looping) return;
    const min = clonesBefore.length;
    const max = clonesBefore.length + total - 1;
    if (position < min || position > max) {
      position = clonesBefore.length + current;
      applyTransform(false);
      syncStates();
    }
  });

  if (prevArrow) prevArrow.addEventListener('click', () => goTo(-1, true));
  if (nextArrow) nextArrow.addEventListener('click', () => goTo(1, true));

  if (dotsList) {
    const buttons = [...dotsList.querySelectorAll('button')];
    buttons.forEach((button, i) => {
      button.addEventListener('click', () => goTo(i, false));
    });
    dotsList.addEventListener('keydown', (e) => {
      const idx = buttons.indexOf(document.activeElement);
      if (idx === -1) return;
      let next;
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          next = (idx - 1 + total) % total;
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          next = (idx + 1) % total;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = total - 1;
          break;
        default:
          return;
      }
      e.preventDefault();
      buttons[next].focus();
      goTo(next, false);
    });
  }

  /* swipe / drag — mirrors slick's `swipe: true` with the same 1/4-slide threshold */
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let dragPercent = 0;

  list.addEventListener('pointerdown', (e) => {
    if (animating || total <= slidesToShow) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    dragging = false;
    dragPercent = 0;
  });

  list.addEventListener('pointermove', (e) => {
    if (pointerId === null || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!dragging) {
      if (Math.abs(dx) < 5 || Math.abs(dx) < Math.abs(dy)) return;
      dragging = true;
      element.classList.add('slick-dragging');
      list.setPointerCapture(pointerId);
    }
    const count = trackLength();
    dragPercent = (dx / list.clientWidth) * 100;
    track.style.transitionDuration = '0ms';
    track.style.transform = `translate3d(${-sign * ((position / count) * 100) + dragPercent}%, 0, 0)`;
  });

  function endDrag(e) {
    if (pointerId === null || e.pointerId !== pointerId) return;
    pointerId = null;
    if (!dragging) return;
    dragging = false;
    element.classList.remove('slick-dragging');
    const threshold = 100 / slidesToShow / 4;
    const moved = sign * dragPercent;
    if (moved <= -threshold) goTo(1, true);
    else if (moved >= threshold) goTo(-1, true);
    else applyTransform(true);
    dragPercent = 0;
  }

  list.addEventListener('pointerup', endDrag);
  list.addEventListener('pointercancel', endDrag);
  list.addEventListener('dragstart', (e) => e.preventDefault());

  /* autoplay with pause on hover and focus, as slick did */
  let timer = null;
  let interrupted = false;

  function stopAutoplay() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function startAutoplay() {
    if (!autoplay || interrupted || total <= slidesToShow) return;
    stopAutoplay();
    timer = window.setInterval(() => goTo(1, true), autoplaySpeed);
  }

  function interrupt(state) {
    interrupted = state;
    if (state) stopAutoplay();
    else startAutoplay();
  }

  if (autoplay) {
    element.addEventListener('mouseenter', () => interrupt(true));
    element.addEventListener('mouseleave', () => interrupt(false));
    element.addEventListener('focusin', () => interrupt(true));
    element.addEventListener('focusout', () => interrupt(false));
    document.addEventListener('visibilitychange', () => interrupt(document.hidden));
  }

  MOBILE.addEventListener('change', build);
  TABLET.addEventListener('change', build);
  // the percentage layout is fluid, so only a breakpoint change needs a rebuild

  build();
  startAutoplay();

  return {
    element,
    next: () => goTo(1, true),
    prev: () => goTo(-1, true),
    goTo: (i) => goTo(i, false),
    get current() { return current; },
    get slidesToShow() { return slidesToShow; },
    play: startAutoplay,
    pause: stopAutoplay,
    refresh: build,
  };
}
