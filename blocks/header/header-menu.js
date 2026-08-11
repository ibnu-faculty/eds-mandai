/*
 * Builds the Mandai mega menu — a port of wrs/components/structure/headerv2
 * together with its `main-menu` / `top-left-menu` sub-components and the
 * header-v2.js and navbar-search.js plugins.
 *
 * The `/nav` fragment holds one `nav-menu` block. Each row starts with a keyword
 * that says what the row configures:
 *
 *   logo       | (image) | (home link)
 *   ticket     | (link)                     the yellow "Buy Tickets" button
 *   search     | (label) | (search page)
 *   login      | (label) | (login url)
 *   member     | (welcome label) | (account url) | (list of account links)
 *   languages  | (list of links; the current language is bold)
 *   secondary  | (label) | (menu content)   the small utility row above the logo
 *   primary    | (label) | (menu content)   the main category row
 *
 * "menu content" is ordinary authored content and is read as follows:
 *   - a heading starts a new column and becomes its label
 *   - a list adds that column's links
 *   - an image starts a spotlight card; the link and paragraph that follow it
 *     become the card's title and description
 *   - a list whose items each carry an icon name in bold renders as the
 *     quick-access links strip
 */

/** the mega menu collapses into the drawer at the same width the original did */
export const MOBILE_MENU_MQ = window.matchMedia('(max-width: 1024px)');

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

function firstLink(cell) {
  return cell ? cell.querySelector('a[href]') : null;
}

function chevron(direction = 'right', extraClass = '') {
  const span = document.createElement('span');
  span.className = `icon icon-chevron-${direction}${extraClass ? ` ${extraClass}` : ''}`;
  span.setAttribute('aria-hidden', 'true');
  return span;
}

function arrowCircle() {
  const arrow = document.createElement('div');
  arrow.className = 'md-link-arrow';
  arrow.append(chevron('right'));
  return arrow;
}

/* ------------------------------------------------------------ menu content -- */

function buildDropdownItem(item) {
  const li = document.createElement('li');
  li.className = 'dropdown-item';

  const link = item.querySelector('a[href]');
  if (!link) {
    li.textContent = item.textContent.trim();
    return li;
  }

  const anchor = document.createElement('a');
  anchor.className = 'menu-link';
  anchor.href = link.getAttribute('href');
  anchor.textContent = link.textContent.trim();

  if (link.target === '_blank' || /^https?:\/\//i.test(link.getAttribute('href') || '')) {
    const href = link.getAttribute('href') || '';
    if (!href.startsWith('/') && link.hostname && link.hostname !== window.location.hostname) {
      li.classList.add('external');
      anchor.target = '_blank';
      anchor.rel = 'noopener';
      const icon = document.createElement('span');
      icon.className = 'icon icon-mandai-external-link mandai-icon';
      icon.setAttribute('aria-hidden', 'true');
      anchor.append(document.createTextNode(' '), icon);
    }
  }

  if (item.querySelector('strong')) anchor.classList.add('all-link');

  li.append(anchor);
  return li;
}

function buildQuickAccessLinks(list) {
  const wrapper = document.createElement('div');
  wrapper.className = 'links-with-icon';

  [...list.querySelectorAll('li')].forEach((item) => {
    const link = item.querySelector('a[href]');
    if (!link) return;
    const iconName = (item.querySelector('strong') || {}).textContent;

    const quickLink = document.createElement('a');
    quickLink.className = 'quick-access-link';
    quickLink.href = link.getAttribute('href');
    if (iconName) {
      const icon = document.createElement('span');
      icon.className = `link-icon icon icon-${iconName.trim()} mandai-icon`;
      icon.setAttribute('aria-hidden', 'true');
      quickLink.append(icon);
    }
    quickLink.append(document.createTextNode(link.textContent.trim()));
    wrapper.append(quickLink);
  });

  return wrapper;
}

function buildSpotlight(picture, titleLink, description, isPrimary) {
  const container = document.createElement('div');
  container.className = 'spotlight-container spotlight-card-container';

  const card = document.createElement(titleLink ? 'a' : 'div');
  card.className = 'spotlight-card';
  if (isPrimary) card.classList.add('spotlight-card--primary-category');
  if (titleLink) {
    card.href = titleLink.getAttribute('href');
    if (titleLink.target) card.target = titleLink.target;
  }

  if (picture) {
    picture.classList.add('spotlight-image');
    picture.querySelectorAll('img').forEach((img) => { img.loading = 'lazy'; });
    card.append(picture);
  }

  const content = document.createElement('div');
  content.className = 'spotlight-content';

  if (titleLink) {
    const link = document.createElement('div');
    link.className = 'spotlight-link';
    const withArrow = document.createElement('div');
    withArrow.className = 'md-link-with-arrow';
    withArrow.append(document.createTextNode(titleLink.textContent.trim()), arrowCircle());
    link.append(withArrow);
    content.append(link);
  }

  if (description) {
    const desc = document.createElement('div');
    desc.className = 'spotlight-description';
    const span = document.createElement('span');
    span.innerHTML = description;
    desc.append(span);
    content.append(desc);
  }

  card.append(content);
  container.append(card);
  return container;
}

/**
 * Reads a "menu content" cell into the mega-menu panel.
 * @param {Element} cell
 * @param {boolean} isPrimary primary categories use the lighter panel background
 */
function buildDropdownMenu(cell, isPrimary) {
  const menu = document.createElement('div');
  menu.className = 'dropdown-menu';

  const container = document.createElement('div');
  container.className = 'dropdown-menu-container';
  if (isPrimary) container.classList.add('dropdown-menu-container--primary-category');

  const inner = document.createElement('div');
  inner.className = 'dropdown-menu-container-inner';

  const linksContainer = document.createElement('div');
  linksContainer.className = 'dropdown-menu-links-container';

  const spotlightInner = document.createElement('div');
  spotlightInner.className = 'dropdown-menu-container-inner dropdown-menu-container--spotlight';

  let column = null;
  let additional = null;
  let pendingPicture = null;
  let pendingTitle = null;

  const flushSpotlight = (description) => {
    if (!pendingPicture && !pendingTitle) return;
    spotlightInner.append(buildSpotlight(pendingPicture, pendingTitle, description, isPrimary));
    pendingPicture = null;
    pendingTitle = null;
  };

  const source = cell ? cell.querySelector(':scope > div') || cell : null;
  const nodes = source ? [...source.children] : [];

  nodes.forEach((node) => {
    const tag = node.tagName.toLowerCase();

    if (/^h[1-6]$/.test(tag)) {
      flushSpotlight('');
      column = document.createElement('div');
      column.className = 'dropdown-menu-column';
      const label = document.createElement('div');
      label.className = 'dropdown-label secondary-categories-label';
      label.append(document.createTextNode(node.textContent.trim()));
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'dropdown-btn';
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', `Toggle ${node.textContent.trim()}`);
      button.append(chevron('down'));
      label.append(button);
      column.append(label);
      linksContainer.append(column);
      return;
    }

    if (tag === 'ul' || tag === 'ol') {
      const items = [...node.querySelectorAll(':scope > li')];
      const isQuickAccess = items.length > 0
        && items.every((li) => li.querySelector('strong') && li.querySelector('a[href]'));

      if (isQuickAccess) {
        if (!additional) {
          additional = document.createElement('div');
          additional.className = 'dropdown-menu-additional desktop';
          const links = document.createElement('div');
          links.className = 'quick-access-links';
          additional.append(links);
          inner.append(additional);
        }
        additional.querySelector('.quick-access-links').append(buildQuickAccessLinks(node));
        return;
      }

      const list = document.createElement('ul');
      list.className = 'dropdown-icons secondary-category dropdown-menu';
      items.forEach((item) => list.append(buildDropdownItem(item)));
      if (!column) {
        column = document.createElement('div');
        column.className = 'dropdown-menu-column';
        linksContainer.append(column);
      }
      column.append(list);
      return;
    }

    const picture = node.querySelector('picture');
    if (picture) {
      flushSpotlight('');
      pendingPicture = picture;
      return;
    }

    const link = node.querySelector('a[href]');
    if (link && (pendingPicture || !column)) {
      pendingTitle = link;
      return;
    }

    if (pendingPicture || pendingTitle) {
      flushSpotlight(node.innerHTML);
      return;
    }

    if (node.textContent.trim() && additional) {
      const label = document.createElement('div');
      label.className = 'dropdown-label';
      label.textContent = node.textContent.trim();
      additional.prepend(label);
    }
  });

  flushSpotlight('');

  if (linksContainer.children.length) inner.prepend(linksContainer);
  if (inner.children.length) container.append(inner);
  if (spotlightInner.children.length) container.append(spotlightInner);

  menu.append(container);
  return menu.querySelector('.dropdown-menu-container').children.length ? menu : null;
}

/* ------------------------------------------------------------------ header -- */

function buildNavLink(label, href, menu, { primary = false } = {}) {
  const li = document.createElement('li');
  li.className = primary ? 'nav-link primary-category' : 'nav-link nav-link--secondary';

  const trigger = document.createElement(href ? 'a' : 'span');
  if (href) trigger.href = href;
  trigger.append(document.createTextNode(label));
  if (primary) trigger.append(arrowCircle());

  li.append(trigger);

  if (menu) {
    li.classList.add('has-dropdown');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'true');
    li.append(menu);
  }

  return li;
}

function buildLanguages(cell) {
  const items = cell ? [...cell.querySelectorAll('li')] : [];
  if (!items.length) return null;

  const li = document.createElement('li');
  li.className = 'nav-link nav-link--secondary setting-link language visible-desktop';

  const current = items.find((item) => item.querySelector('strong')) || items[0];

  const label = document.createElement('div');
  label.className = 'label-with-icons';
  const globe = document.createElement('span');
  globe.className = 'icon icon-globe-americas';
  globe.setAttribute('aria-hidden', 'true');
  const selected = document.createElement('span');
  selected.className = 'lang-selected';
  selected.textContent = current.textContent.trim();
  label.append(globe, selected, chevron('down'));
  label.setAttribute('role', 'button');
  label.tabIndex = 0;
  label.setAttribute('aria-expanded', 'false');
  li.append(label);

  const list = document.createElement('ul');
  list.className = 'settings-dropdown';
  items.forEach((item) => {
    const link = item.querySelector('a[href]');
    const option = document.createElement('li');
    option.className = 'dropdown-item';
    if (item === current) option.classList.add('selected');
    if (link) {
      const anchor = document.createElement('a');
      anchor.href = link.getAttribute('href');
      anchor.textContent = link.textContent.trim();
      option.append(anchor);
    } else {
      option.textContent = item.textContent.trim();
    }
    list.append(option);
  });
  li.append(list);
  return li;
}

function buildSearch(label) {
  const li = document.createElement('li');
  li.className = 'nav-link nav-link--secondary setting-link search visible-desktop';
  const wrapper = document.createElement('div');
  wrapper.className = 'label-with-icons';
  wrapper.setAttribute('role', 'button');
  wrapper.tabIndex = 0;
  wrapper.setAttribute('aria-label', label || 'Search');
  const icon = document.createElement('span');
  icon.className = 'icon icon-mandai-search mandai-icon';
  icon.setAttribute('aria-hidden', 'true');
  const text = document.createElement('span');
  text.textContent = label || 'Search';
  wrapper.append(icon, text);
  li.append(wrapper);
  return li;
}

function buildLogin(label, href) {
  const li = document.createElement('li');
  li.className = 'nav-link nav-link--secondary setting-link login';

  const desktop = document.createElement('div');
  desktop.className = 'wrapper-desktop visible-desktop';
  const anchor = document.createElement('a');
  anchor.className = 'label-with-icons';
  anchor.href = href;
  const icon = document.createElement('span');
  icon.className = 'icon icon-user-alt';
  icon.setAttribute('aria-hidden', 'true');
  const text = document.createElement('span');
  text.textContent = ` ${label}`;
  anchor.append(icon, text);
  desktop.append(anchor);

  const mobile = document.createElement('div');
  mobile.className = 'wrapper-mobile hidden-desktop';
  const mobileLink = document.createElement('a');
  mobileLink.className = 'member-button hidden-desktop';
  mobileLink.href = href;
  mobileLink.setAttribute('aria-label', label);
  const button = document.createElement('div');
  button.className = 'md-member-button';
  const mobileIcon = document.createElement('span');
  mobileIcon.className = 'icon icon-user-alt';
  mobileIcon.setAttribute('aria-hidden', 'true');
  button.append(mobileIcon);
  mobileLink.append(button);
  mobile.append(mobileLink);

  li.append(desktop, mobile);
  return li;
}

function buildSearchPanel(placeholder, searchUrl) {
  const panel = document.createElement('div');
  panel.className = 'md-navbar-search';

  const input = document.createElement('input');
  input.className = 'input-form search';
  input.type = 'text';
  input.name = 'search';
  input.id = 'search-news';
  input.placeholder = placeholder || 'Search';
  input.setAttribute('aria-label', placeholder || 'Search');

  const submit = document.createElement('span');
  submit.className = 'label-form search-btn';
  submit.setAttribute('role', 'button');
  submit.tabIndex = 0;
  submit.setAttribute('aria-label', 'Search Button');

  const clear = document.createElement('span');
  clear.className = 'label-close close-btn';
  clear.setAttribute('role', 'button');
  clear.tabIndex = 0;
  clear.setAttribute('aria-label', 'Clear Button');

  const group = document.createElement('div');
  group.className = 'form-group ui-autocomplete-input';
  group.autocomplete = 'off';
  group.append(input, submit, clear);

  const news = document.createElement('div');
  news.className = 'search-news';
  news.append(group);

  const wrap = document.createElement('div');
  wrap.className = 'md search-wrap';
  wrap.append(news);

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'md-navbar-search__input';
  inputWrapper.append(wrap);

  panel.append(inputWrapper);

  const submitSearch = () => {
    const term = input.value.trim();
    if (!term || !searchUrl) return;
    const url = new URL(searchUrl, window.location);
    url.searchParams.set('q', term);
    window.location.href = url.toString();
  };

  input.addEventListener('input', () => {
    clear.classList.toggle('active', input.value.length > 0);
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submitSearch();
  });
  submit.addEventListener('click', submitSearch);
  submit.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') submitSearch();
  });
  clear.addEventListener('click', () => {
    input.value = '';
    clear.classList.remove('active');
    input.focus();
  });

  return panel;
}

/* ------------------------------------------------------------- behaviours -- */

function wireDropdowns(header) {
  const navLinks = [...header.querySelectorAll('.nav-link.has-dropdown, .primary-category')];

  const closeAll = () => {
    navLinks.forEach((link) => {
      link.classList.remove('open');
      const trigger = link.querySelector(':scope > a, :scope > span');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  };

  navLinks.forEach((link) => {
    const trigger = link.querySelector(':scope > a, :scope > span');
    const menu = link.querySelector(':scope > .dropdown-menu');
    if (!trigger || !menu) return;

    // on touch and in the mobile drawer, the first activation opens the panel
    trigger.addEventListener('click', (event) => {
      if (!MOBILE_MENU_MQ.matches) return;
      event.preventDefault();
      const open = link.classList.contains('open');
      closeAll();
      if (!open) {
        link.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      closeAll();
      trigger.focus();
    });

    link.addEventListener('focusin', () => {
      if (MOBILE_MENU_MQ.matches) return;
      trigger.setAttribute('aria-expanded', 'true');
    });
    link.addEventListener('focusout', (event) => {
      if (MOBILE_MENU_MQ.matches) return;
      if (link.contains(event.relatedTarget)) return;
      trigger.setAttribute('aria-expanded', 'false');
    });
  });

  header.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });
  MOBILE_MENU_MQ.addEventListener('change', closeAll);

  /* the column labels collapse inside the mobile drawer */
  header.querySelectorAll('.dropdown-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const column = button.closest('.dropdown-menu-column');
      const open = column.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
  });
}

function wireSettings(header) {
  const settings = [...header.querySelectorAll('.setting-link .label-with-icons')];
  settings.forEach((label) => {
    const dropdown = label.parentElement.querySelector('.settings-dropdown');
    if (!dropdown) return;
    const toggle = (event) => {
      event.preventDefault();
      const open = label.parentElement.classList.toggle('open');
      label.setAttribute('aria-expanded', String(open));
    };
    label.addEventListener('click', toggle);
    label.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      toggle(event);
    });
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('.setting-link')) return;
    header.querySelectorAll('.setting-link.open').forEach((el) => {
      el.classList.remove('open');
      const label = el.querySelector('.label-with-icons');
      if (label) label.setAttribute('aria-expanded', 'false');
    });
  });
}

function wireSearchToggle(header, panel) {
  const openers = [...header.querySelectorAll('.setting-link.search .label-with-icons')];
  const input = panel.querySelector('input');

  const open = () => {
    panel.classList.add('active');
    document.body.classList.add('search-open');
    input.focus();
  };
  const close = () => {
    panel.classList.remove('active');
    document.body.classList.remove('search-open');
  };

  openers.forEach((opener) => {
    opener.addEventListener('click', open);
    opener.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
  });

  panel.addEventListener('click', (event) => {
    if (event.target === panel) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
}

function wireMobileDrawer(header) {
  const toggle = header.querySelector('[data-toggle-menu]');
  const back = header.querySelector('[data-back-menu]');
  const drawer = header.querySelector('.mobile-header-layer');
  if (!toggle || !drawer) return;

  const setOpen = (open) => {
    header.classList.toggle('menu-open', open);
    document.body.classList.toggle('scroll-lock', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.menu-icon-open').style.display = open ? 'none' : '';
    toggle.querySelector('.menu-icon-close').style.display = open ? '' : 'none';
  };

  toggle.addEventListener('click', () => setOpen(!header.classList.contains('menu-open')));
  if (back) {
    back.addEventListener('click', () => {
      const open = drawer.querySelector('.nav-link.open, .primary-category.open');
      if (open) {
        open.classList.remove('open');
        return;
      }
      setOpen(false);
    });
  }

  MOBILE_MENU_MQ.addEventListener('change', (event) => {
    if (!event.matches) setOpen(false);
  });
}

/** header-v2.js hid the sticky header while scrolling down and revealed it on scroll up */
function wireStickyHeader(header) {
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const { height } = header.getBoundingClientRect();
    if (y > lastY && y > height) header.style.top = `-${Math.round(height)}px`;
    else header.style.top = '';
    lastY = y;
  }, { passive: true });
}

/* -------------------------------------------------------------------------- */

/**
 * Builds the header element from the authored `nav-menu` block.
 * @param {Element} source the `.nav-menu` block from the /nav fragment
 * @returns {HTMLElement} the `<header>` element
 */
export function buildHeader(source) {
  const config = {
    logoImage: null,
    logoHref: '/',
    logoAlt: '',
    ticketLabel: '',
    ticketHref: '',
    searchLabel: '',
    searchHref: '',
    searchPlaceholder: '',
    loginLabel: '',
    loginHref: '',
    languages: null,
    secondary: [],
    primary: [],
  };

  [...source.children].forEach((row) => {
    const cells = [...row.children];
    const key = cellText(cells[0]).toLowerCase();
    switch (key) {
      case 'logo': {
        config.logoImage = cells[1] ? cells[1].querySelector('img') : null;
        const link = firstLink(cells[2]);
        config.logoHref = link ? link.getAttribute('href') : (cellText(cells[2]) || '/');
        config.logoAlt = config.logoImage ? config.logoImage.alt : '';
        break;
      }
      case 'ticket': {
        const link = firstLink(cells[1]);
        config.ticketLabel = link ? link.textContent.trim() : cellText(cells[1]);
        config.ticketHref = link ? link.getAttribute('href') : cellText(cells[2]);
        break;
      }
      case 'search': {
        config.searchLabel = cellText(cells[1]);
        const link = firstLink(cells[2]);
        config.searchHref = link ? link.getAttribute('href') : cellText(cells[2]);
        config.searchPlaceholder = cellText(cells[3]) || config.searchLabel;
        break;
      }
      case 'login': {
        config.loginLabel = cellText(cells[1]);
        const link = firstLink(cells[2]);
        config.loginHref = link ? link.getAttribute('href') : cellText(cells[2]);
        break;
      }
      case 'languages': {
        const [, languagesCell] = cells;
        config.languages = languagesCell;
        break;
      }
      case 'secondary':
        config.secondary.push({
          label: cellText(cells[1]),
          href: firstLink(cells[2]) ? firstLink(cells[2]).getAttribute('href') : '',
          content: cells[3] || cells[2],
        });
        break;
      case 'primary':
        config.primary.push({
          label: cellText(cells[1]),
          href: firstLink(cells[2]) ? firstLink(cells[2]).getAttribute('href') : '',
          content: cells[3] || cells[2],
        });
        break;
      default:
        break;
    }
  });

  /* --- first row: utility links, logo, tickets, language, login, search --- */

  const secondaryList = document.createElement('ul');
  secondaryList.className = 'dropdown visible-desktop secondary-categories';
  config.secondary.forEach(({ label, href, content }) => {
    secondaryList.append(buildNavLink(label, href, buildDropdownMenu(content, false)));
  });

  const menuToggle = document.createElement('button');
  menuToggle.type = 'button';
  menuToggle.setAttribute('data-toggle-menu', '');
  menuToggle.setAttribute('aria-label', 'Menu');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.innerHTML = '<span class="menu-icon-open"><span class="menu-icon">'
    + '<span class="icon icon-bars"></span></span></span>'
    + '<span class="menu-icon-close" style="display:none"><span class="menu-icon">'
    + '<span class="icon icon-times"></span></span></span>';

  const menuToggleWrapper = document.createElement('div');
  menuToggleWrapper.className = 'mobile-container';
  menuToggleWrapper.append(menuToggle);

  const logo = document.createElement('div');
  logo.className = 'logo';
  if (config.logoImage) {
    const anchor = document.createElement('a');
    anchor.href = config.logoHref;
    config.logoImage.alt = config.logoAlt || '';
    anchor.append(config.logoImage);
    logo.append(anchor);
  }

  const midContainer = document.createElement('div');
  midContainer.className = 'mid-container';
  midContainer.append(menuToggleWrapper, logo);

  const rightMobile = document.createElement('div');
  rightMobile.className = 'mobile-container';
  if (config.ticketHref || config.ticketLabel) {
    const anchor = document.createElement('a');
    anchor.className = 'buy-tickets';
    anchor.href = config.ticketHref;
    const button = document.createElement('div');
    button.className = 'md-button md-button-buynow';
    const strong = document.createElement('b');
    strong.textContent = config.ticketLabel;
    const span = document.createElement('span');
    span.append(strong);
    button.append(span);
    anchor.append(button);
    rightMobile.append(anchor);
  }
  const backButton = document.createElement('button');
  backButton.type = 'button';
  backButton.className = 'btn-icon-back';
  backButton.setAttribute('data-back-menu', '');
  backButton.setAttribute('aria-label', 'Menu Back');
  backButton.innerHTML = '<span class="menu-icon-back"><span class="menu-icon">'
    + '<span class="icon icon-chevron-left"></span></span></span>';
  rightMobile.append(backButton);

  const utilityMenu = document.createElement('ul');
  utilityMenu.className = 'dropdown dropdown--utility-menu';
  const languages = buildLanguages(config.languages);
  if (languages) utilityMenu.append(languages);
  if (config.loginLabel) utilityMenu.append(buildLogin(config.loginLabel, config.loginHref));
  if (config.searchLabel) utilityMenu.append(buildSearch(config.searchLabel));

  const rightContainer = document.createElement('div');
  rightContainer.className = 'right-container';
  rightContainer.append(rightMobile, utilityMenu);

  const businessLayer = document.createElement('div');
  businessLayer.className = 'header-container business-layer';
  businessLayer.append(secondaryList, midContainer, rightContainer);

  /* --- second row: the primary categories -------------------------------- */

  const primaryList = document.createElement('ul');
  primaryList.className = 'dropdown primary-categories desktop';
  config.primary.forEach(({ label, href, content }) => {
    primaryList.append(
      buildNavLink(label, href, buildDropdownMenu(content, true), { primary: true }),
    );
  });

  const separator = document.createElement('div');
  separator.className = 'primary-categories-separator';

  const secondaryMobile = document.createElement('ul');
  secondaryMobile.className = 'dropdown primary-categories primary-categories--sub mobile';
  config.secondary.forEach(({ label, href, content }) => {
    secondaryMobile.append(
      buildNavLink(label, href, buildDropdownMenu(content, false), { primary: true }),
    );
  });

  const other = document.createElement('ul');
  other.className = 'other';
  if (config.ticketHref || config.ticketLabel) {
    const li = document.createElement('li');
    li.className = 'other-link';
    const anchor = document.createElement('a');
    anchor.href = config.ticketHref;
    const count = document.createElement('span');
    count.className = 'count-number';
    const strong = document.createElement('b');
    strong.textContent = config.ticketLabel;
    anchor.append(count, strong);
    li.append(anchor);
    other.append(li);
  }

  const utilityTools = document.createElement('div');
  utilityTools.className = 'menu-utility-tools hidden-desktop';
  if (config.languages) {
    const mobileLanguages = buildLanguages(config.languages);
    if (mobileLanguages) {
      mobileLanguages.className = 'settings-btn setting-link languages';
      utilityTools.append(mobileLanguages);
    }
  }
  if (config.searchLabel) {
    const mobileSearch = buildSearch(config.searchLabel);
    mobileSearch.className = 'settings-btn setting-link search';
    utilityTools.append(mobileSearch);
  }

  const mobileLayer = document.createElement('div');
  mobileLayer.className = 'header-container header-container--second mobile-header-layer';
  mobileLayer.append(primaryList, separator, secondaryMobile, other, utilityTools);

  /* --- assembly ---------------------------------------------------------- */

  const grid = document.createElement('div');
  grid.className = 'grid';
  grid.append(businessLayer, mobileLayer);

  const nav = document.createElement('nav');
  nav.className = 'wrapper-header';
  nav.setAttribute('aria-label', 'Main navigation');
  nav.append(grid);

  const header = document.createElement('header');
  header.className = 'md-header md-header--mega-menu';

  const searchPanel = buildSearchPanel(config.searchPlaceholder, config.searchHref);
  header.append(nav, searchPanel);

  wireDropdowns(header);
  wireSettings(header);
  wireSearchToggle(header, searchPanel);
  wireMobileDrawer(header);
  wireStickyHeader(header);

  return header;
}
