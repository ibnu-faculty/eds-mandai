import { optimizePicture } from '../../scripts/renue.js';

/*
 * Re:Nue Hero Slide — child of the `renue-hero` carousel container. Model
 * defined alongside its parent in blocks/renue-hero/_renue-hero.json. Field
 * order: image, eyebrow, heading, ctaText, ctaLink.
 *
 * Self-decorates in place (same pattern as
 * blocks/renue-stat-item/renue-stat-item.js and
 * blocks/renue-accordion-item/renue-accordion-item.js) rather than being
 * wrapped by the parent afterwards — the parent renue-hero.js just re-parents
 * this already-decorated element into its <li> track item.
 *
 * The Re:Nue theme CSS is loaded by the parent container, not here.
 *
 * IMPORTANT — Universal Editor authorability: field elements are MOVED
 * into the new structure (not re-created from textContent) so the
 * `data-aue-*` instrumentation Universal Editor attaches stays intact and
 * every field remains click-to-edit in the author UI.
 */
export default function decorate(block) {
  // Only the first slide's heading should be an <h1> (one per page); later
  // slides use <h2> so a multi-slide hero doesn't produce several <h1>s.
  // `block` is still a direct child of the `renue-hero` container at this point
  // (the parent re-parents already-decorated slides into the track
  // afterwards), so sibling order is available here.
  const siblingSlides = [...(block.parentElement?.querySelectorAll(':scope > .renue-hero-slide') || [])];
  const isFirstSlide = siblingSlides[0] === block;

  // Cell order: image, eyebrow, heading, cta. The model's `cta`/`ctaText` pair
  // is a collapsible field group, so it arrives as a single cell holding an
  // anchor whose text is already the button label.
  const [imageRow, eyebrowRow, headingRow, ctaRow] = [...block.children];

  const picture = imageRow?.querySelector('picture');
  const eyebrowEl = eyebrowRow?.firstElementChild || eyebrowRow;
  const headingEl = headingRow?.firstElementChild || headingRow;
  const ctaLinkEl = ctaRow?.querySelector('a');

  block.innerHTML = '';
  block.classList.add('renue-hero__slide');

  if (picture) {
    // Eager + a wide breakpoint set: when this hero is the page's first
    // section, its first slide is the LCP candidate — scripts/scripts.js
    // awaits that section's images in loadEager().
    optimizePicture(picture, { eager: true });
    const img = picture.querySelector('img');
    if (img?.src) block.style.backgroundImage = `url('${img.src}')`;
    // Keep the original picture element around (off-screen) so Universal
    // Editor still finds an editable image reference on the page.
    picture.classList.add('renue-hero__source-image');
    block.append(picture);
  }

  const body = document.createElement('div');
  body.className = 'renue-hero__body';

  if (eyebrowEl) {
    eyebrowEl.classList.add('renue-hero__eyebrow');
    body.append(eyebrowEl);
  }
  if (headingEl) {
    const heading = document.createElement(isFirstSlide ? 'h1' : 'h2');
    heading.className = 'renue-hero__headline';
    heading.append(...headingEl.childNodes);
    body.append(heading);
  }
  if (ctaLinkEl) {
    ctaLinkEl.className = 'renue-btn renue-btn--white';
    body.append(ctaLinkEl);
  }

  block.append(body);
}
