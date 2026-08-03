import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// matches the tablet/mobile breakpoint used for the slidesToShow=1 setting
const SLIDES_MEDIA = window.matchMedia('(max-width: 767px)');
// matches Site.isMobile() (screen-tablet-landscape - 1), used for the background image swap
const BACKGROUND_MEDIA = window.matchMedia('(max-width: 1023px)');
// matches Site.isMobile(), used for the one-time mobile dot-hiding check on init
const DOTS_HIDE_MEDIA = window.matchMedia('(max-width: 1023px)');

let carouselUid = 0;

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

function cellLink(cell) {
  return cell ? cell.querySelector('a') : null;
}

function cellImage(cell) {
  return cell ? cell.querySelector('img') : null;
}

function readConfig(row) {
  const [
    backgroundCell,
    backgroundImageCell,
    headingCell,
    ariaLabelCell,
    descriptionCell,
    anchorCell,
    ctaCell,
  ] = [...row.children];
  const images = backgroundImageCell ? [...backgroundImageCell.querySelectorAll('img')] : [];
  const cta = cellLink(ctaCell);
  return {
    background: cellText(backgroundCell) || 'base',
    desktopImage: images[0],
    mobileImage: images[1],
    headingCell,
    heading: cellText(headingCell),
    ariaLabel: cellText(ariaLabelCell),
    descriptionCell,
    descriptionHTML: descriptionCell ? descriptionCell.innerHTML.trim() : '',
    anchorId: cellText(anchorCell),
    ctaCell,
    ctaHref: cta ? cta.href : '',
    ctaText: cta ? cta.textContent.trim() : '',
  };
}

function readSlide(row) {
  const [imageCell, linkCell, titleCell, descriptionCell, gradientCell, hideCell] = [
    ...row.children,
  ];
  const link = cellLink(linkCell);
  return {
    row,
    img: cellImage(imageCell),
    href: link ? link.href : '',
    titleCell,
    title: cellText(titleCell),
    descriptionCell,
    descriptionHTML: descriptionCell ? descriptionCell.innerHTML.trim() : '',
    gradient: cellText(gradientCell),
    hidden: cellText(hideCell).toLowerCase() === 'true',
  };
}

function buildSlide(data) {
  const inner = document.createElement('div');
  inner.className = 'feature-carousel-slide-inner';
  if (data.gradient) inner.classList.add(data.gradient);

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'feature-carousel-slide-image';
  if (data.img) {
    const optimizedPicture = createOptimizedPicture(data.img.src, data.img.alt, false, [{ width: '750' }]);
    moveInstrumentation(data.img, optimizedPicture.querySelector('img'));
    imageWrapper.append(optimizedPicture);
  }
  inner.append(imageWrapper);

  if (data.title || data.descriptionHTML) {
    const content = document.createElement('div');
    content.className = 'feature-carousel-slide-content';
    const contentInner = document.createElement('div');
    contentInner.className = 'feature-carousel-slide-content-inner';
    if (data.title) {
      const title = document.createElement('h3');
      title.className = 'feature-carousel-slide-title';
      title.textContent = data.title;
      moveInstrumentation(data.titleCell, title);
      contentInner.append(title);
    }
    if (data.descriptionHTML) {
      const description = document.createElement('div');
      description.className = 'feature-carousel-slide-description';
      description.innerHTML = data.descriptionHTML;
      moveInstrumentation(data.descriptionCell, description);
      contentInner.append(description);
    }
    content.append(contentInner);
    inner.append(content);
  }

  const slide = document.createElement('div');
  slide.className = 'feature-carousel-slide';
  if (data.href) {
    const a = document.createElement('a');
    a.href = data.href;
    a.append(inner);
    slide.append(a);
  } else {
    slide.append(inner);
  }
  moveInstrumentation(data.row, slide);
  return slide;
}

function getFocusable(el) {
  return [...el.querySelectorAll('a, button, input, select, textarea, [tabindex]')];
}

function setSlideFocusable(slide, focusable) {
  getFocusable(slide).forEach((el) => {
    if (focusable) {
      el.removeAttribute('tabindex');
      el.removeAttribute('aria-hidden');
    } else {
      el.setAttribute('tabindex', '-1');
      el.setAttribute('aria-hidden', 'true');
    }
  });
  slide.setAttribute('aria-hidden', focusable ? 'false' : 'true');
}

function buildArrowButton(direction) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `feature-carousel-arrow feature-carousel-arrow-${direction}`;
  const srText = document.createElement('span');
  srText.className = 'feature-carousel-visually-hidden';
  srText.textContent = direction === 'prev' ? 'Previous slide' : 'Next slide';
  button.append(srText);
  return button;
}

function buildDotButton(index) {
  const li = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  const srText = document.createElement('span');
  srText.className = 'feature-carousel-visually-hidden';
  srText.textContent = `Go to slide ${index + 1}`;
  button.append(srText);
  li.append(button);
  return li;
}

function buildCarousel(realSlides, label) {
  carouselUid += 1;
  const uid = carouselUid;

  const slider = document.createElement('div');
  slider.className = 'feature-carousel-slider';

  const viewport = document.createElement('div');
  viewport.className = 'feature-carousel-viewport';

  const track = document.createElement('div');
  track.className = 'feature-carousel-track';

  viewport.append(track);
  slider.append(viewport);

  const total = realSlides.length;
  if (!total) return slider;

  viewport.setAttribute('role', 'region');
  viewport.setAttribute('aria-label', 'carousel');

  realSlides.forEach((slide, i) => {
    slide.id = `feature-carousel-${uid}-slide-${i}`;
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `slide ${i + 1} of ${total}`);
  });

  const dotsList = document.createElement('ul');
  dotsList.className = 'feature-carousel-dots';
  dotsList.setAttribute('role', 'group');
  const dotButtons = realSlides.map((slide, i) => {
    const li = buildDotButton(i);
    dotsList.append(li);
    return li.querySelector('button');
  });

  const prevButton = buildArrowButton('prev');
  const nextButton = buildArrowButton('next');
  slider.append(prevButton, nextButton, dotsList);

  const dotsHiddenOnce = DOTS_HIDE_MEDIA.matches && total <= 2;

  let slidesToShow = Math.min(2, total);
  let clonesBefore = [];
  let looping = false;
  let extendedIndex = 0;
  let currentReal = 0;
  let isAnimating = false;

  function realIndex(idx) {
    return ((idx % total) + total) % total;
  }

  function percentFor(idx) {
    return (100 / slidesToShow) * idx;
  }

  function applyTransform(withTransition) {
    if (!withTransition) track.style.transition = 'none';
    track.style.transform = `translateX(-${percentFor(extendedIndex)}%)`;
    if (!withTransition) {
      track.getBoundingClientRect();
      track.style.transition = '';
    }
  }

  function refreshActiveStates() {
    const children = [...track.children];
    const visible = new Set();
    for (let i = 0; i < slidesToShow; i += 1) visible.add(extendedIndex + i);
    children.forEach((child, i) => {
      const isVisible = visible.has(i);
      child.classList.toggle('feature-carousel-slide-current', isVisible);
      setSlideFocusable(child, isVisible);
    });
    dotButtons.forEach((btn, i) => {
      if (i === currentReal) {
        btn.setAttribute('aria-current', 'true');
        btn.setAttribute('aria-disabled', 'true');
      } else {
        btn.removeAttribute('aria-current');
        btn.removeAttribute('aria-disabled');
      }
    });
  }

  function updateControlsVisibility() {
    prevButton.hidden = !looping;
    nextButton.hidden = !looping;
    dotsList.hidden = !looping || dotsHiddenOnce;
  }

  function rebuild() {
    slidesToShow = Math.min(SLIDES_MEDIA.matches ? 1 : 2, total);
    looping = total > slidesToShow;
    slider.style.setProperty('--fc-slides-to-show', String(slidesToShow));

    if (looping) {
      clonesBefore = realSlides.slice(total - slidesToShow).map((s) => {
        const clone = s.cloneNode(true);
        clone.classList.add('feature-carousel-slide-clone');
        clone.removeAttribute('id');
        return clone;
      });
      const clonesAfter = realSlides.slice(0, slidesToShow).map((s) => {
        const clone = s.cloneNode(true);
        clone.classList.add('feature-carousel-slide-clone');
        clone.removeAttribute('id');
        return clone;
      });
      track.replaceChildren(...clonesBefore, ...realSlides, ...clonesAfter);
    } else {
      clonesBefore = [];
      track.replaceChildren(...realSlides);
    }

    extendedIndex = clonesBefore.length + currentReal;
    applyTransform(false);
    updateControlsVisibility();
    refreshActiveStates();
  }

  function goTo(target, isDelta) {
    if (!looping || isAnimating) return;
    const targetReal = isDelta ? realIndex(currentReal + target) : realIndex(target);
    const forward = ((targetReal - currentReal) + total) % total;
    const backward = forward - total;
    const steps = Math.abs(forward) <= Math.abs(backward) ? forward : backward;
    if (steps === 0) return;
    extendedIndex += steps;
    currentReal = targetReal;
    isAnimating = true;
    applyTransform(true);
    refreshActiveStates();
  }

  track.addEventListener('transitionend', (e) => {
    if (e.target !== track) return;
    isAnimating = false;
    const minReal = clonesBefore.length;
    const maxReal = clonesBefore.length + total - 1;
    if (extendedIndex < minReal || extendedIndex > maxReal) {
      extendedIndex = clonesBefore.length + currentReal;
      applyTransform(false);
      refreshActiveStates();
    }
  });

  prevButton.addEventListener('click', () => goTo(-1, true));
  nextButton.addEventListener('click', () => goTo(1, true));

  dotButtons.forEach((btn, i) => {
    btn.addEventListener('click', () => goTo(i, false));
  });

  dotsList.addEventListener('keydown', (e) => {
    const idx = dotButtons.indexOf(document.activeElement);
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
    dotButtons[next].focus();
    goTo(next, false);
  });

  let pointerId = null;
  let startX = 0;
  let dragDeltaPercent = 0;

  viewport.addEventListener('pointerdown', (e) => {
    if (!looping || isAnimating) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    dragDeltaPercent = 0;
    track.style.transition = 'none';
    viewport.setPointerCapture(pointerId);
  });

  viewport.addEventListener('pointermove', (e) => {
    if (pointerId === null || e.pointerId !== pointerId) return;
    dragDeltaPercent = ((e.clientX - startX) / viewport.clientWidth) * 100;
    track.style.transform = `translateX(-${percentFor(extendedIndex) - dragDeltaPercent}%)`;
  });

  function endDrag(e) {
    if (pointerId === null || e.pointerId !== pointerId) return;
    pointerId = null;
    track.style.transition = '';
    const threshold = 100 / slidesToShow / 4;
    if (dragDeltaPercent <= -threshold) {
      goTo(1, true);
    } else if (dragDeltaPercent >= threshold) {
      goTo(-1, true);
    } else {
      applyTransform(true);
    }
    dragDeltaPercent = 0;
  }

  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  rebuild();
  SLIDES_MEDIA.addEventListener('change', rebuild);

  slider.setAttribute('data-label', label);
  return slider;
}

function setupBackgroundImage(block, desktopImage, mobileImage) {
  const desktopUrl = desktopImage ? desktopImage.src : '';
  const mobileUrl = mobileImage ? mobileImage.src : '';
  function update() {
    if (BACKGROUND_MEDIA.matches && mobileUrl) {
      block.style.backgroundImage = `url('${mobileUrl}')`;
    } else if (desktopUrl) {
      block.style.backgroundImage = `url('${desktopUrl}')`;
    }
  }
  update();
  BACKGROUND_MEDIA.addEventListener('change', update);
}

export default function decorate(block) {
  const rows = [...block.children];
  const configRow = rows.shift();
  const config = readConfig(configRow);
  configRow.remove();

  const slidesData = rows.map(readSlide).filter((slide) => !slide.hidden);
  rows.forEach((row) => row.remove());

  block.textContent = '';
  if (config.anchorId) block.id = config.anchorId;
  if (config.background === 'bgImage') {
    block.classList.add('bg-custom');
  } else if (config.background) {
    block.classList.add(config.background);
  }

  const content = document.createElement('div');
  content.className = 'feature-carousel-content';

  if (config.heading) {
    const heading = document.createElement('h2');
    heading.className = 'feature-carousel-heading';
    heading.textContent = config.heading;
    moveInstrumentation(config.headingCell, heading);
    content.append(heading);
  }

  if (config.descriptionHTML) {
    const description = document.createElement('div');
    description.className = 'feature-carousel-description';
    description.innerHTML = config.descriptionHTML;
    moveInstrumentation(config.descriptionCell, description);
    content.append(description);
  }

  const slides = slidesData.map(buildSlide);
  content.append(buildCarousel(slides, config.ariaLabel || config.heading || 'Carousel'));

  if (config.ctaHref) {
    const ctaWrapper = document.createElement('div');
    ctaWrapper.className = 'feature-carousel-cta';
    const cta = document.createElement('a');
    cta.className = 'feature-carousel-button';
    cta.href = config.ctaHref;
    cta.textContent = config.ctaText;
    moveInstrumentation(config.ctaCell, cta);
    ctaWrapper.append(cta);
    content.append(ctaWrapper);
  }

  block.append(content);

  if (config.background === 'bgImage') {
    setupBackgroundImage(block, config.desktopImage, config.mobileImage);
  }
}
