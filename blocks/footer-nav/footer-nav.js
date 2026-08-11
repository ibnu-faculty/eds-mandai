import { moveInstrumentation } from '../../scripts/scripts.js';
import {
  decorateIcons, isMobile, MOBILE_MQ, onMediaChange,
} from '../../scripts/site.js';

/*
 * Ports wrs/components/structure/footerv2 (everything below the conservation
 * banner) plus its accordion-footer.js and list-social.js plugins.
 *
 * Each authored row starts with a keyword that says what the row is:
 *   awards      | title | images (each optionally linked)
 *   social      | title | list of links; a link's title is its tooltip and an
 *                        image inside the item becomes its QR popup
 *   links-left  | category title | list of links
 *   links-right | category title | list of links
 *   legal       | copyright rich text | list of links
 *
 * Reproduces the HTL output: `.md-footer.md-footer--style-2` containing the
 * `.secondary-footer` (awards + social), the `.primary-footer` link columns and
 * the `.legal-footer`, with the awards block repeated below the links on mobile
 * exactly as the original did.
 */

const SOCIAL_ICONS = [
  [/facebook\./i, 'facebook'],
  [/instagram\./i, 'instagram'],
  [/tiktok\.|douyin\./i, 'tiktok'],
  [/youtube\./i, 'youtube-play'],
  [/linkedin\./i, 'linkedin'],
  [/weixin|wechat/i, 'weixin'],
];

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

function iconFor(href, label) {
  const haystack = `${href} ${label}`;
  const match = SOCIAL_ICONS.find(([pattern]) => pattern.test(haystack));
  return match ? match[1] : null;
}

function sectionTitle(text, withArrow) {
  const wrapper = document.createElement('div');
  wrapper.className = 'section-title';
  const heading = document.createElement('h2');
  heading.className = 'title';
  heading.append(document.createTextNode(text));
  if (withArrow) {
    const arrow = document.createElement('span');
    arrow.className = 'icon icon-chevron-down visible-sm visible-xs icon-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    heading.append(arrow);
  }
  wrapper.append(heading);
  return wrapper;
}

/* ------------------------------------------------------------------ awards -- */

function buildAwards(title, contentCell) {
  const container = document.createElement('div');
  container.className = 'award-accolades-container';
  if (title) container.append(sectionTitle(title, false));

  const list = document.createElement('ul');
  list.className = 'list-award';

  [...contentCell.querySelectorAll('img')].forEach((img) => {
    const li = document.createElement('li');
    img.loading = 'lazy';
    img.height = img.height || 80;
    img.width = img.width || 80;
    const link = img.closest('a[href]');
    if (link) {
      const anchor = document.createElement('a');
      anchor.className = 'award-accolades-link';
      anchor.href = link.getAttribute('href');
      anchor.append(img);
      li.append(anchor);
    } else {
      const wrapper = document.createElement('div');
      wrapper.append(img);
      li.append(wrapper);
    }
    list.append(li);
  });

  const accolades = document.createElement('div');
  accolades.className = 'award-accolades';
  accolades.append(list);
  container.append(accolades);
  return container;
}

/* ------------------------------------------------------------------ social -- */

function buildSocial(title, contentCell) {
  const container = document.createElement('div');
  container.className = 'social-follow-container';
  if (title) container.append(sectionTitle(title, false));

  const list = document.createElement('ul');
  list.className = 'list-social';

  [...contentCell.querySelectorAll('li')].forEach((item) => {
    const link = item.querySelector('a[href]');
    const label = link ? (link.title || link.textContent.trim()) : item.textContent.trim();
    const href = link ? link.getAttribute('href') : '';
    const iconName = iconFor(href, label);

    /*
     * Images in the item are read in order: when the network has no glyph the
     * first one is the icon itself (the old `social-icon default`), and the
     * remaining one is the QR code shown in the popup.
     */
    const images = [...item.querySelectorAll('img')];
    const iconImage = iconName ? null : images.shift();
    const qr = images.shift() || null;

    const li = document.createElement('li');
    const target = document.createElement(href ? 'a' : 'div');
    if (href) {
      target.href = href;
      target.target = '_blank';
      target.rel = 'noopener';
      target.title = label;
    } else {
      target.className = 'no-social-link';
    }
    target.setAttribute('aria-label', label);

    if (iconName) {
      const icon = document.createElement('span');
      icon.className = `icon icon-${iconName}`;
      icon.setAttribute('aria-hidden', 'true');
      target.append(icon);
    } else if (iconImage) {
      const wrapper = document.createElement('span');
      iconImage.classList.add('social-icon', 'default');
      iconImage.alt = iconImage.alt || label;
      wrapper.append(iconImage);
      target.append(wrapper);
    }

    if (qr) {
      const popup = document.createElement('div');
      popup.className = 'icon-popup';
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'btn-close';
      close.setAttribute('aria-label', 'Close social popup');
      close.innerHTML = '<span class="icon icon-times"></span>';
      popup.append(close, qr);
      target.append(popup);
    }

    li.append(target);
    list.append(li);
  });

  const follow = document.createElement('div');
  follow.className = 'social-follow no-top-margin';
  follow.append(list);
  container.append(follow);
  return container;
}

/** list-social.js — the QR popups open on hover (desktop) or tap (mobile) */
function wireSocial(scope) {
  const items = [...scope.querySelectorAll('.list-social li')];
  const closeAll = () => {
    scope.querySelectorAll('.icon-popup.active').forEach((p) => p.classList.remove('active'));
    scope.querySelectorAll('.list-social li a.active, .list-social li .no-social-link.active')
      .forEach((el) => el.classList.remove('active'));
  };

  items.forEach((item) => {
    const popup = item.querySelector('.icon-popup');
    if (!popup) return;
    const target = item.querySelector('a, .no-social-link');

    item.addEventListener('mouseenter', () => {
      if (isMobile()) return;
      closeAll();
      popup.classList.add('active');
    });
    item.addEventListener('mouseleave', () => {
      if (isMobile()) return;
      popup.classList.remove('active');
    });
    item.addEventListener('click', (event) => {
      if (!isMobile()) return;
      if (event.target.closest('.btn-close')) return;
      // the first tap only reveals the QR code
      if (!popup.classList.contains('active')) {
        event.preventDefault();
        closeAll();
        popup.classList.add('active');
        if (target) target.classList.add('active');
      }
    });
    popup.querySelector('.btn-close').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeAll();
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.list-social li')) closeAll();
  });
  onMediaChange(MOBILE_MQ, closeAll);
}

/* ------------------------------------------------------------ link columns -- */

function buildLinkColumn(title, contentCell) {
  const column = document.createElement('div');
  column.className = 'col-md-4';

  const inner = document.createElement('div');
  inner.className = 'inner';
  if (title) inner.append(sectionTitle(title, true));

  const body = document.createElement('div');
  body.className = 'section-body';

  const list = document.createElement('ul');
  list.className = 'footer-link';
  [...contentCell.querySelectorAll('li')].forEach((item) => {
    const li = document.createElement('li');
    const link = item.querySelector('a[href]');
    if (link) {
      if (link.target === '_blank') {
        link.rel = 'noopener';
        link.append(document.createTextNode(' '));
        const icon = document.createElement('span');
        icon.className = 'icon icon-external-link-alt';
        icon.setAttribute('aria-hidden', 'true');
        link.append(icon);
      }
      li.append(link);
    } else {
      const span = document.createElement('span');
      span.textContent = item.textContent.trim();
      li.append(span);
    }
    list.append(li);
  });
  body.append(list);
  inner.append(body);

  const section = document.createElement('div');
  section.className = 'footer-section';
  section.append(inner);
  column.append(section);
  return column;
}

/** accordion-footer.js — below 992px each link column collapses */
function wireAccordion(primaryFooter) {
  const sections = [...primaryFooter.querySelectorAll('.footer-section')];
  const noAccordion = primaryFooter.classList.contains('no-accordion');

  sections.forEach((section) => {
    const title = section.querySelector('.section-title');
    const body = section.querySelector('.section-body');
    if (!title || !body) return;

    title.setAttribute('role', 'button');
    title.tabIndex = 0;
    title.setAttribute('aria-expanded', String(noAccordion));

    const toggle = () => {
      if (!isMobile()) return;
      const open = section.classList.toggle('open');
      title.setAttribute('aria-expanded', String(open));
      body.style.display = open ? 'block' : 'none';
    };

    title.addEventListener('click', toggle);
    title.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle();
    });
  });

  onMediaChange(MOBILE_MQ, (mobile) => {
    sections.forEach((section) => {
      const body = section.querySelector('.section-body');
      const title = section.querySelector('.section-title');
      if (!body || !title) return;
      if (!mobile) {
        body.style.display = '';
        section.classList.remove('open');
        title.setAttribute('aria-expanded', 'true');
      } else {
        body.style.display = noAccordion ? 'block' : 'none';
        section.classList.toggle('open', noAccordion);
        title.setAttribute('aria-expanded', String(noAccordion));
      }
    });
  });
}

/* ------------------------------------------------------------------- legal -- */

function buildLegal(copyCell, linksCell) {
  const legal = document.createElement('div');
  legal.className = 'legal-footer';

  const container = document.createElement('div');
  container.className = 'legal-footer-container';

  if (copyCell && copyCell.textContent.trim()) {
    const copy = document.createElement('div');
    copy.className = 'copy';
    copy.innerHTML = copyCell.innerHTML;
    moveInstrumentation(copyCell, copy);
    container.append(copy);
  }

  if (linksCell) {
    const list = document.createElement('ul');
    list.className = 'footer-navigation';
    [...linksCell.querySelectorAll('li')].forEach((item) => {
      const li = document.createElement('li');
      const link = item.querySelector('a[href]');
      if (link) {
        if (link.target === '_blank') {
          link.rel = 'noopener';
          const icon = document.createElement('span');
          icon.className = 'icon icon-external-link-alt';
          icon.setAttribute('aria-hidden', 'true');
          link.append(document.createTextNode(' '), icon);
        }
        li.append(link);
      } else {
        li.textContent = item.textContent.trim();
      }
      list.append(li);
    });
    if (list.children.length) container.append(list);
  }

  const grid = document.createElement('div');
  grid.className = 'grid';
  grid.append(container);
  legal.append(grid);
  return legal;
}

/* -------------------------------------------------------------------------- */

export default function decorate(block) {
  const parsed = {
    awards: null, social: null, left: [], right: [], legal: null,
  };

  [...block.children].forEach((row) => {
    const [keyCell, titleCell, contentCell] = [...row.children];
    const key = cellText(keyCell).toLowerCase();
    const title = cellText(titleCell);
    switch (key) {
      case 'awards':
        parsed.awards = { title, cell: contentCell };
        break;
      case 'social':
        parsed.social = { title, cell: contentCell };
        break;
      case 'links-left':
        parsed.left.push({ title, cell: contentCell });
        break;
      case 'links-right':
        parsed.right.push({ title, cell: contentCell });
        break;
      case 'legal':
        parsed.legal = { copy: titleCell, links: contentCell };
        break;
      default:
        break;
    }
  });

  const grid = document.createElement('div');
  grid.className = 'grid';

  /* awards + social, side by side above the links on desktop */
  if (parsed.awards || parsed.social) {
    const row = document.createElement('div');
    row.className = 'row';

    const awardsColumn = document.createElement('div');
    awardsColumn.className = 'col-md-6 visible-md-up';
    if (parsed.awards) awardsColumn.append(buildAwards(parsed.awards.title, parsed.awards.cell));
    row.append(awardsColumn);

    const socialColumn = document.createElement('div');
    socialColumn.className = 'col-sm-12 col-md-6';
    if (parsed.social) socialColumn.append(buildSocial(parsed.social.title, parsed.social.cell));
    row.append(socialColumn);

    const secondary = document.createElement('div');
    secondary.className = 'secondary-footer secondary-footer--new-icon col-full-custom';
    secondary.append(row);
    grid.append(secondary);
  }

  /* the two link column groups */
  if (parsed.left.length || parsed.right.length) {
    const row = document.createElement('div');
    row.className = 'row';

    [['float-left', parsed.left], ['float-right', parsed.right]].forEach(([float, columns]) => {
      const half = document.createElement('div');
      half.className = 'col-md-6';
      const inner = document.createElement('div');
      inner.className = `row ${float}`;
      columns.forEach(({ title, cell }) => inner.append(buildLinkColumn(title, cell)));
      half.append(inner);
      row.append(half);
    });

    const primary = document.createElement('div');
    primary.className = 'primary-footer no-accordion';
    primary.append(row);
    grid.append(primary);
    wireAccordion(primary);
  }

  /* awards again, below the links, for narrow viewports */
  if (parsed.awards) {
    const row = document.createElement('div');
    row.className = 'row';
    const column = document.createElement('div');
    column.className = 'col-sm-12';
    column.append(buildAwards(parsed.awards.title, parsed.awards.cell.cloneNode(true)));
    row.append(column);

    const secondary = document.createElement('div');
    secondary.className = 'secondary-footer secondary-footer--new-icon col-full-custom hidden-md-up';
    secondary.append(row);
    grid.append(secondary);
  }

  const main = document.createElement('div');
  main.className = 'main-footer';
  main.append(grid);

  const footer = document.createElement('footer');
  footer.className = 'md-footer md-footer--style-2';
  footer.append(main);

  if (parsed.legal) footer.append(buildLegal(parsed.legal.copy, parsed.legal.links));

  block.replaceChildren(footer);
  decorateIcons(block);
  wireSocial(block);
}
