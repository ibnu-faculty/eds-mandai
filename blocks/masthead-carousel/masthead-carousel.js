import { moveInstrumentation } from '../../scripts/scripts.js';
import {
  decorateIcons, isMobile, isTrue, MOBILE_MQ, onMediaChange, pauseMedia, playMedia,
} from '../../scripts/site.js';

/*
 * Ports wrs/components/mandai/mandaimastheadcarousel together with its
 * masthead-carousel.js, video-banner.js and timer-countdown.js plugins.
 *
 * Row 1 is the configuration: [viewport scaling (100|75), autoplay, autoplay speed].
 * Every later row is a slide:
 *   [media option (image|video|vimeo|youtube), images (desktop then mobile),
 *    heading, sub heading, cta, text alignment, text gradient, image gradient,
 *    cta bottom spacing (%), media (desktop), media (mobile), controls,
 *    autoloop, countdown end, countdown redirect, countdown description]
 *
 * Reproduces the HTL output:
 *   <div class="md md-masthead-component md-masthead-component--style2 banner
 *               banner__style2 banner__carousel">
 *     <div class="banner__content">
 *       <div class="banner__carousel-wrapper height-100">
 *         <div class="banner__content-item">
 *           <picture class="cover-picture">…</picture>
 *           <div class="banner__content__text text-center text-gradient align-end">
 *             <h1>…</h1><span>…</span><a class="md-button-big" href=…>…</a>
 *           </div>
 *         </div>
 *       </div>
 *       <div class="banner__carousel-arrow"><div class="grid"><div class="slick-slider">
 *         <button class="btn btn-next-zoo slick-arrow"></button>
 *         <button class="btn btn-pre-zoo slick-arrow"></button>
 *       </div></div></div>
 *     </div>
 *   </div>
 *
 * The transition is a cross-fade, matching slick's `fade: true` configuration.
 */

const DEFAULT_SPEED = 5000;
const FADE_MS = 500;

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

function cellHref(cell) {
  const link = cell ? cell.querySelector('a[href]') : null;
  return link ? link.getAttribute('href') : cellText(cell);
}

/* ----------------------------------------------------------------- media ---- */

function buildPicture(desktopImage, mobileImage, alt, eager) {
  const picture = document.createElement('picture');
  picture.className = 'cover-picture';

  if (desktopImage) {
    const source = document.createElement('source');
    source.media = '(min-width: 1025px)';
    source.srcset = desktopImage.src;
    picture.append(source);
  }
  if (mobileImage) {
    const source = document.createElement('source');
    source.srcset = mobileImage.src;
    picture.append(source);
  }

  const img = document.createElement('img');
  const fallback = mobileImage || desktopImage;
  if (fallback) img.src = fallback.src;
  img.alt = alt || '';
  img.setAttribute('fetchpriority', eager ? 'high' : 'low');
  if (!eager) img.loading = 'lazy';
  picture.append(img);
  return picture;
}

function buildControls(controls) {
  if (!controls.mute && !controls.play) return null;
  const wrapper = document.createElement('div');
  wrapper.className = 'md-masthead__controller';
  const inner = document.createElement('div');
  inner.className = 'md-masthead__controller-wrapper';

  if (controls.mute) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'md-masthead__volume-button';
    button.setAttribute('aria-label', 'Unmute video');
    button.innerHTML = '<span class="icon icon-volume-up hidden"></span>'
      + '<span class="icon icon-volume-mute"></span>';
    inner.append(button);
  }
  if (controls.play) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'md-masthead__play-button';
    button.setAttribute('aria-label', 'Pause video');
    button.innerHTML = '<span class="icon icon-play hidden"></span>'
      + '<span class="icon icon-pause"></span>';
    inner.append(button);
  }

  wrapper.append(inner);
  return wrapper;
}

function wireControls(wrapper, getMedia) {
  const volumeButton = wrapper.querySelector('.md-masthead__volume-button');
  const playButton = wrapper.querySelector('.md-masthead__play-button');

  if (volumeButton) {
    volumeButton.addEventListener('click', () => {
      const media = getMedia();
      const muted = !(media && media.muted === false);
      if (media && 'muted' in media) media.muted = !muted;
      volumeButton.querySelectorAll('.icon').forEach((i) => i.classList.toggle('hidden'));
      volumeButton.setAttribute('aria-label', muted ? 'Mute video' : 'Unmute video');
    });
  }

  if (playButton) {
    playButton.addEventListener('click', () => {
      const media = getMedia();
      const paused = media ? media.paused : true;
      if (media) {
        if (paused) {
          const play = media.play();
          if (play && play.catch) play.catch(() => { /* autoplay blocked */ });
        } else {
          media.pause();
        }
      }
      playButton.querySelectorAll('.icon').forEach((i) => i.classList.toggle('hidden'));
      playButton.setAttribute('aria-label', paused ? 'Pause video' : 'Play video');
    });
  }
}

function buildVideo(data) {
  const container = document.createElement('div');
  container.className = 'cover-picture';

  const wrapper = document.createElement('div');
  wrapper.className = 'video-wrapper';

  const video = document.createElement('video');
  video.className = 'video-banner arrows-on-playing';
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.loop = data.autoloop;
  if (data.posterImage) video.poster = data.posterImage.src;

  const source = document.createElement('source');
  source.type = 'video/mp4';
  onMediaChange(MOBILE_MQ, (mobile) => {
    const src = mobile ? (data.mediaMobile || data.media) : data.media;
    if (src && source.getAttribute('src') !== src) {
      source.setAttribute('src', src);
      video.load();
      const play = video.play();
      if (play && play.catch) play.catch(() => { /* autoplay blocked */ });
    }
  });
  video.append(source);
  wrapper.append(video);
  container.append(wrapper);

  if (!data.mediaMobile && data.mobileImage) {
    const fallback = document.createElement('img');
    fallback.className = 'mobile-fallback-img';
    fallback.src = data.mobileImage.src;
    fallback.alt = data.alt || '';
    container.append(fallback);
  }

  const controls = buildControls(data.controls);
  if (controls) {
    container.append(controls);
    wireControls(controls, () => video);
  }

  return container;
}

function vimeoSrc(id, autoloop, inline) {
  const params = new URLSearchParams({
    autoplay: '1',
    loop: inline ? String(autoloop ? 1 : 0) : '0',
    muted: inline ? '1' : '0',
    background: '1',
    title: '0',
    byline: '0',
    portrait: '0',
    controls: '0',
    playsinline: '1',
  });
  if (inline) params.set('autopause', '0');
  return `https://player.vimeo.com/video/${id}?${params.toString()}`;
}

function buildVimeo(data) {
  const container = document.createElement('div');
  container.className = 'cover-picture';

  const wrapper = document.createElement('div');
  wrapper.className = 'vimeo-wrapper';

  const inline = data.playback !== 'modal';

  if (data.media) {
    const iframe = document.createElement('iframe');
    iframe.className = 'vimeo-video vimeo-desktop';
    iframe.src = vimeoSrc(data.media, data.autoloop, inline);
    iframe.title = data.heading || 'Video';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; fullscreen');
    iframe.allowFullscreen = true;
    wrapper.append(iframe);
  }
  if (data.mediaMobile) {
    const iframe = document.createElement('iframe');
    iframe.className = 'vimeo-video vimeo-mobile';
    iframe.src = vimeoSrc(data.mediaMobile, data.autoloop, inline);
    iframe.title = data.heading || 'Video';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; fullscreen');
    iframe.allowFullscreen = true;
    wrapper.append(iframe);
  }

  container.append(wrapper);

  if (!data.mediaMobile && data.mobileImage) {
    const fallback = document.createElement('img');
    fallback.className = 'mobile-fallback-img';
    fallback.src = data.mobileImage.src;
    fallback.alt = data.alt || '';
    container.append(fallback);
  }

  const controls = buildControls(data.controls);
  if (controls) container.append(controls);

  return container;
}

function buildYoutube(data) {
  const container = document.createElement('div');
  container.className = 'cover-picture';
  const wrapper = document.createElement('div');
  wrapper.className = 'youtube-wrapper';
  const iframe = document.createElement('iframe');
  iframe.src = `${data.media}?autoplay=1&mute=1&playsinline=1&enablejsapi=1&loop=1&controls=0`;
  iframe.title = data.heading || 'Video';
  iframe.allowFullscreen = true;
  wrapper.append(iframe);
  container.append(wrapper);
  return container;
}

/* ------------------------------------------------------------- countdown ---- */

function buildCountdown(endValue, redirect) {
  const wrapper = document.createElement('div');
  wrapper.className = 'countdown-wrapper';
  const list = document.createElement('ul');
  const units = [['days', 'Days'], ['hours', 'Hours'], ['minutes', 'Mins'], ['seconds', 'Secs']];
  const spans = {};
  units.forEach(([key, label]) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.className = key;
    spans[key] = span;
    li.append(span, document.createTextNode(label));
    list.append(li);
  });
  wrapper.append(list);

  const end = new Date(endValue).getTime();
  if (Number.isNaN(end)) return wrapper;

  let timer = null;
  const tick = () => {
    const remaining = end - Date.now();
    if (remaining <= 0) {
      units.forEach(([key]) => { spans[key].textContent = '0'; });
      if (timer) window.clearInterval(timer);
      if (redirect) window.location.href = redirect;
      return;
    }
    const seconds = Math.floor(remaining / 1000);
    spans.days.textContent = String(Math.floor(seconds / 86400));
    spans.hours.textContent = String(Math.floor((seconds % 86400) / 3600));
    spans.minutes.textContent = String(Math.floor((seconds % 3600) / 60));
    spans.seconds.textContent = String(seconds % 60);
  };
  timer = window.setInterval(tick, 1000);
  tick();

  return wrapper;
}

/* ----------------------------------------------------------------- slide ---- */

function readSlide(row) {
  const cells = [...row.children];
  const images = cells[1] ? [...cells[1].querySelectorAll('img')] : [];
  const controlsValue = cellText(cells[11]).toLowerCase();
  return {
    row,
    media: cellText(cells[0]).toLowerCase() || 'image',
    desktopImage: images[0],
    mobileImage: images[1] || images[0],
    alt: images[0] ? images[0].alt : '',
    headingCell: cells[2],
    heading: cellText(cells[2]),
    subHeadingCell: cells[3],
    subHeading: cellText(cells[3]),
    ctaCell: cells[4],
    textAlignment: cellText(cells[5]) || 'text-center',
    textGradient: isTrue(cellText(cells[6])) ? 'text-gradient' : '',
    imageGradient: cellText(cells[7]),
    ctaBottomSpacing: cellText(cells[8]),
    mediaSrc: cellText(cells[9]),
    mediaMobileSrc: cellText(cells[10]),
    controls: {
      mute: controlsValue.includes('mute') || controlsValue.includes('volume'),
      play: controlsValue.includes('play') || controlsValue.includes('pause'),
    },
    autoloop: isTrue(cellText(cells[12])),
    countdownEnd: cellText(cells[13]),
    countdownRedirect: cellHref(cells[14]),
    countdownDescription: cellText(cells[15]),
  };
}

function buildSlide(data, index) {
  const item = document.createElement('div');
  item.className = 'banner__content-item';
  if (data.imageGradient) item.classList.add(data.imageGradient);

  const mediaData = {
    ...data,
    media: data.mediaSrc,
    mediaMobile: data.mediaMobileSrc,
    posterImage: data.desktopImage,
  };

  if (data.media === 'video' && data.mediaSrc) {
    if (!data.mediaMobileSrc && data.mobileImage) item.classList.add('no-mobile-src');
    item.append(buildVideo(mediaData));
  } else if (data.media === 'vimeo' && (data.mediaSrc || data.mediaMobileSrc)) {
    if (!data.mediaMobileSrc && data.mobileImage) item.classList.add('no-mobile-src');
    item.append(buildVimeo(mediaData));
  } else if (data.media === 'youtube' && data.mediaSrc) {
    item.append(buildYoutube(mediaData));
  } else {
    item.append(buildPicture(data.desktopImage, data.mobileImage, data.alt, index === 0));
  }

  if (data.heading || data.subHeading || data.ctaCell) {
    const text = document.createElement('div');
    text.className = 'banner__content__text';
    text.classList.add(data.textAlignment);
    if (data.textGradient) text.classList.add(data.textGradient);
    if (data.ctaBottomSpacing) {
      text.classList.add('align-end');
      text.style.bottom = `${parseFloat(data.ctaBottomSpacing)}%`;
    }

    if (data.heading) {
      const h1 = document.createElement('h1');
      h1.textContent = data.heading;
      moveInstrumentation(data.headingCell, h1);
      text.append(h1);
    }

    if (data.countdownEnd) {
      text.append(buildCountdown(data.countdownEnd, data.countdownRedirect));
      if (data.countdownDescription) {
        const description = document.createElement('span');
        description.className = 'countdown-description';
        description.textContent = data.countdownDescription;
        text.append(description);
      }
    }

    if (data.subHeading) {
      const span = document.createElement('span');
      span.textContent = data.subHeading;
      moveInstrumentation(data.subHeadingCell, span);
      text.append(span);
    }

    const cta = data.ctaCell ? data.ctaCell.querySelector('a[href]') : null;
    if (cta) {
      const anchor = document.createElement('a');
      anchor.className = 'md-button-big';
      anchor.href = cta.getAttribute('href');
      if (cta.target) anchor.target = cta.target;
      anchor.textContent = cta.textContent.trim();
      text.append(anchor);
    }

    item.append(text);
  }

  moveInstrumentation(data.row, item);
  return item;
}

/* ------------------------------------------------------------- carousel ---- */

function initFadeCarousel(wrapper, slides, { autoplay, autoplaySpeed }, prevButton, nextButton) {
  const list = document.createElement('div');
  list.className = 'slick-list';

  const track = document.createElement('div');
  track.className = 'slick-track';
  track.setAttribute('aria-live', autoplay ? 'off' : 'polite');

  slides.forEach((slide, i) => {
    slide.classList.add('slick-slide');
    slide.setAttribute('data-slick-index', String(i));
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `slide ${i + 1} of ${slides.length}`);
  });

  track.append(...slides);
  list.append(track);

  const dots = document.createElement('ul');
  dots.className = 'slick-dots';
  dots.setAttribute('role', 'group');
  const dotButtons = slides.map((slide, i) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    // the pill is drawn on the <li>, so the button fills it to stay clickable
    const label = document.createElement('span');
    label.className = 'visually-hidden';
    label.textContent = `Go to slide ${i + 1}`;
    button.append(label);
    li.append(button);
    dots.append(li);
    return button;
  });

  wrapper.replaceChildren(list, dots);
  wrapper.classList.add('slick-initialized', 'slick-slider');
  wrapper.setAttribute('role', 'region');
  wrapper.setAttribute('aria-label', 'carousel');
  wrapper.tabIndex = 0;

  const total = slides.length;
  let current = 0;
  let timer = null;

  const focusable = 'a, button, input, select, textarea, iframe, [tabindex]';

  function render() {
    slides.forEach((slide, i) => {
      const isActive = i === current;
      slide.classList.toggle('slick-active', isActive);
      slide.classList.toggle('slick-current', isActive);
      slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      slide.querySelectorAll(focusable).forEach((el) => {
        if (isActive) {
          el.removeAttribute('tabindex');
          el.removeAttribute('aria-hidden');
        } else {
          el.setAttribute('tabindex', '-1');
          el.setAttribute('aria-hidden', 'true');
        }
      });
      if (isActive) playMedia(slide);
      else pauseMedia(slide);
    });
    [...dots.children].forEach((li, i) => li.classList.toggle('slick-active', i === current));
    dotButtons.forEach((button, i) => {
      if (i === current) {
        button.setAttribute('aria-selected', 'true');
        button.setAttribute('aria-current', 'true');
      } else {
        button.setAttribute('aria-selected', 'false');
        button.removeAttribute('aria-current');
      }
    });
  }

  function goTo(index) {
    current = ((index % total) + total) % total;
    render();
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    if (!autoplay || total < 2) return;
    stop();
    timer = window.setInterval(() => goTo(current + 1), autoplaySpeed);
  }

  prevButton.addEventListener('click', () => { goTo(current - 1); start(); });
  nextButton.addEventListener('click', () => { goTo(current + 1); start(); });
  dotButtons.forEach((button, i) => {
    button.addEventListener('click', () => { goTo(i); start(); });
  });

  wrapper.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') goTo(current - 1);
    else if (event.key === 'ArrowRight') goTo(current + 1);
    else return;
    event.preventDefault();
    start();
  });

  if (autoplay) {
    wrapper.addEventListener('mouseenter', stop);
    wrapper.addEventListener('mouseleave', start);
    wrapper.addEventListener('focusin', stop);
    wrapper.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  }

  /* swipe, matching slick's default `swipe: true` */
  let startX = null;
  list.addEventListener('pointerdown', (e) => { startX = e.clientX; });
  list.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) < 40) return;
    goTo(current + (dx < 0 ? 1 : -1));
    start();
  });

  render();
  start();
}

export default function decorate(block) {
  const rows = [...block.children];
  const configRow = rows.shift();
  const configCells = configRow ? [...configRow.children] : [];
  const viewportScaling = cellText(configCells[0]);
  const autoplay = isTrue(cellText(configCells[1]));
  const autoplaySpeed = parseInt(cellText(configCells[2]), 10) || DEFAULT_SPEED;

  const slideData = rows.map((row) => readSlide(row));
  const slides = slideData.map((data, i) => buildSlide(data, i));
  const hasVimeo = slideData.some((data) => data.media === 'vimeo');

  const wrapper = document.createElement('div');
  wrapper.className = 'banner__carousel-wrapper';
  wrapper.classList.add(viewportScaling === '75' ? 'height-75' : 'height-100');
  wrapper.append(...slides);

  const prevButton = document.createElement('button');
  prevButton.type = 'button';
  prevButton.className = 'btn btn-pre-zoo slick-arrow';
  prevButton.setAttribute('aria-label', 'Previous Slide');

  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'btn btn-next-zoo slick-arrow';
  nextButton.setAttribute('aria-label', 'Next Slide');

  const arrowSlider = document.createElement('div');
  arrowSlider.className = 'slick-slider';
  arrowSlider.append(nextButton, prevButton);

  const arrowGrid = document.createElement('div');
  arrowGrid.className = 'grid';
  arrowGrid.append(arrowSlider);

  const arrows = document.createElement('div');
  arrows.className = 'banner__carousel-arrow';
  arrows.append(arrowGrid);

  const content = document.createElement('div');
  content.className = 'banner__content';
  content.append(wrapper, arrows);

  block.classList.add(
    'md',
    'md-masthead-component',
    'md-masthead-component--style2',
    'banner',
    'banner__style2',
    'banner__carousel',
  );
  if (hasVimeo) block.classList.add('vimeo');
  block.replaceChildren(content);

  /*
   * `--heightReduce` is what the AEM header plugin set so a full-height slide
   * stops below the sticky header.
   */
  const setHeightReduce = () => {
    const header = document.querySelector('header');
    const height = header ? header.getBoundingClientRect().height : 0;
    block.style.setProperty('--heightReduce', `${Math.round(height)}px`);
  };
  setHeightReduce();
  window.addEventListener('resize', setHeightReduce);
  window.setTimeout(setHeightReduce, 1000);

  if (slides.length) {
    initFadeCarousel(wrapper, slides, { autoplay, autoplaySpeed }, prevButton, nextButton);
    if (slides.length < 2) {
      arrows.hidden = true;
      wrapper.querySelector('.slick-dots').hidden = true;
    }
  }

  decorateIcons(block);
  // the mobile media swap needs a re-check once the block is in the document
  onMediaChange(MOBILE_MQ, () => {
    block.classList.toggle('is-mobile', isMobile());
  });
  block.style.setProperty('--fade-duration', `${FADE_MS}ms`);
}
