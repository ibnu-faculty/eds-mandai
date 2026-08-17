/*
 * Re:Nue Stat Item — child component of the `renue-stats` container.
 * Model defined alongside its parent in blocks/renue-stats/_renue-stats.json.
 * Field order: icon, label, value, suffix.
 *
 * Designer annotation on this section in Figma: "Numbers to be animated as
 * running numbers" — each item counts up from 0 the first time it scrolls into
 * view, via the IntersectionObserver below.
 *
 * The Re:Nue theme CSS is loaded by the parent container, not here.
 */

/**
 * Counts an element's text up to its `data-count-to` value.
 * @param {Element} el The element holding the value
 */
function animateValue(el) {
  const target = parseInt(el.dataset.countTo, 10) || 0;
  const suffix = el.dataset.suffix || '';
  const duration = 1200;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    el.textContent = Math.round(eased * target).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/**
 * Runs the count-up once, the first time the element becomes visible.
 * @param {Element} el The element holding the value
 */
function animateOnVisible(el) {
  if (!el) return;
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateValue(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 },
  );
  observer.observe(el);
}

export default function decorate(block) {
  const [iconRow, labelRow, valueRow, suffixRow] = [...block.children];
  const icon = iconRow?.textContent?.trim() || '';
  const label = labelRow?.textContent?.trim() || '';
  const value = parseInt(valueRow?.textContent?.trim(), 10) || 0;
  const suffix = suffixRow?.textContent?.trim() || '';

  block.classList.add('renue-stats__item');
  block.innerHTML = `
    <span class="renue-stats__icon" aria-hidden="true">${icon}</span>
    <span class="renue-stats__label">${label}</span>
    <span class="renue-stats__value" data-count-to="${value}" data-suffix="${suffix}">0</span>
  `;

  animateOnVisible(block.querySelector('[data-count-to]'));
}
