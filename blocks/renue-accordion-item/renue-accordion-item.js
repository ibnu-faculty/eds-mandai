/*
 * Re:Nue Accordion Item — child of `renue-accordion`. Model defined in
 * blocks/renue-accordion/_renue-accordion.json. Field order: accentColor,
 * title, body, openByDefault.
 *
 * The Re:Nue theme CSS is loaded by the parent container, not here.
 */
const ACCENT_MAP = {
  blue: 'var(--renue-color-accent-blue)',
  red: 'var(--renue-color-accent-red)',
  gold: 'var(--renue-color-accent-gold)',
};

export default function decorate(block) {
  const [accentRow, titleRow, bodyRow, openRow] = [...block.children];
  const accent = accentRow?.textContent?.trim().toLowerCase() || 'blue';
  const titleEl = titleRow?.firstElementChild || titleRow;
  const bodyEl = bodyRow?.firstElementChild || bodyRow;
  const openByDefault = /^(true|yes|on)$/i.test(openRow?.textContent?.trim() || '');

  const details = document.createElement('details');
  details.className = 'renue-accordion__item';
  if (openByDefault) details.open = true;

  const summary = document.createElement('summary');
  summary.className = 'renue-accordion__summary';
  summary.innerHTML = `<span class="renue-accordion__icon" style="background:${ACCENT_MAP[accent] || ACCENT_MAP.blue};" aria-hidden="true">&#9679;</span>`;

  if (titleEl) {
    titleEl.classList.add('renue-accordion__title');
    summary.append(titleEl);
  }
  details.append(summary);

  if (bodyEl) {
    bodyEl.classList.add('renue-accordion__body');
    details.append(bodyEl);
  }

  block.innerHTML = '';
  block.append(details);
}
