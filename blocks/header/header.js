import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { MOBILE_MENU_MQ, buildHeader } from './header-menu.js';
import { decorateIcons } from '../../scripts/site.js';

/**
 * Loads and decorates the header from the `/nav` fragment.
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  const source = fragment.querySelector('.nav-menu') || fragment;
  const header = buildHeader(source);

  block.replaceChildren(header);
  decorateIcons(block);

  // keep the masthead's full-height slide in sync with the header height
  const publishHeight = () => {
    document.documentElement.style.setProperty(
      '--heightReduce',
      `${Math.round(header.getBoundingClientRect().height)}px`,
    );
  };
  publishHeight();
  window.addEventListener('resize', publishHeight);
  MOBILE_MENU_MQ.addEventListener('change', publishHeight);
}
