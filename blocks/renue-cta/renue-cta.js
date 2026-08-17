import { loadRenueTheme, optimizePicture } from '../../scripts/renue.js';

/*
 * Re:Nue CTA Banner block ("Questions on your mind?" / FAQ prompt on Homepage).
 * Cell order: image, heading, cta. The model's `cta`/`ctaText` pair is a
 * collapsible field group, so it arrives as a single cell holding an anchor
 * whose text is already the button label.
 */
export default async function decorate(block) {
  await loadRenueTheme();

  const [imageRow, headingRow, ctaRow] = [...block.children];

  const picture = imageRow?.querySelector('picture');
  const headingEl = headingRow?.firstElementChild || headingRow;
  const ctaLinkEl = ctaRow?.querySelector('a');

  if (picture) {
    optimizePicture(picture);
    const img = picture.querySelector('img');
    if (img?.src) block.style.backgroundImage = `url('${img.src}')`;
    picture.classList.add('renue-cta__source-image');
  }

  const overlay = document.createElement('div');
  overlay.className = 'renue-cta__overlay';

  if (headingEl) {
    const h2 = document.createElement('h2');
    h2.className = 'renue-cta__heading';
    h2.append(...headingEl.childNodes);
    overlay.append(h2);
  }
  if (ctaLinkEl) {
    ctaLinkEl.className = 'renue-btn renue-btn--white';
    overlay.append(ctaLinkEl);
  }

  block.innerHTML = '';
  if (picture) block.append(picture);
  block.append(overlay);
}
