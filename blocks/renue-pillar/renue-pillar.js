import { loadRenueTheme, optimizePicture } from '../../scripts/renue.js';

/*
 * Re:Nue Pillar Banner block. Cell order (see _renue-pillar.json):
 * eyebrow, heading, copy, cta, image — the model's `cta`/`ctaText` pair is a
 * collapsible field group, so it arrives as a single cell holding an anchor
 * whose text is already the button label.
 * Reused across pillar pages (Store on Homepage today; Thrift/Donate/Impact
 * pillars later use the same component with different content).
 */
export default async function decorate(block) {
  await loadRenueTheme();

  const [eyebrowRow, headingRow, copyRow, ctaRow, imageRow] = [...block.children];

  const eyebrowEl = eyebrowRow?.firstElementChild || eyebrowRow;
  const headingEl = headingRow?.firstElementChild || headingRow;
  const copyEl = copyRow?.firstElementChild || copyRow;
  const ctaLinkEl = ctaRow?.querySelector('a');
  const picture = imageRow?.querySelector('picture');
  if (picture) optimizePicture(picture);

  const content = document.createElement('div');
  content.className = 'renue-pillar__content';

  if (eyebrowEl) {
    eyebrowEl.classList.add('renue-pillar__eyebrow');
    content.append(eyebrowEl);
  }
  if (headingEl) {
    const h2 = document.createElement('h2');
    h2.className = 'renue-pillar__heading';
    h2.append(...headingEl.childNodes);
    content.append(h2);
  }
  if (copyEl) {
    copyEl.classList.add('renue-pillar__copy');
    content.append(copyEl);
  }
  if (ctaLinkEl) {
    ctaLinkEl.className = 'renue-btn renue-btn--white';
    content.append(ctaLinkEl);
  }

  const media = document.createElement('figure');
  media.className = 'renue-pillar__media';
  if (picture) media.append(picture);

  block.innerHTML = '';
  block.append(content, media);
}
