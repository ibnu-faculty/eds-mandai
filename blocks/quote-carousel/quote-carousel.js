import createCarousel from '../../scripts/carousel.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/*
 * Ports wrs/components/mandai/mandaiquotecarousel.
 *
 * Row 1 is the configuration (background colour, aria label); every later row is
 * a quote: [quote (rich text), name / description].
 *
 * Reproduces the HTL output:
 *   <div class="md md-quote-carousel {bg}"><div class="grid">
 *     <div class="row" data-md-carousel …>
 *       <div class="col-md-12"><div class="md-quote-carousel__message">
 *         <div class="message"><h4>quote</h4></div>
 *         <div class="body-text2">name</div>
 *       </div></div>
 *     </div>
 *   </div></div>
 */

const BACKGROUNDS = ['bg-base', 'bg-sap-white', 'bg-dark-green'];

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

export default function decorate(block) {
  const rows = [...block.children];
  const configRow = rows.shift();
  const configCells = configRow ? [...configRow.children] : [];
  const background = cellText(configCells[0]);
  const ariaLabel = cellText(configCells[1]);

  const track = document.createElement('div');
  track.className = 'row';

  rows.forEach((row) => {
    const [quoteCell, nameCell] = [...row.children];

    const message = document.createElement('div');
    message.className = 'md-quote-carousel__message';

    if (quoteCell && quoteCell.textContent.trim()) {
      const wrapper = document.createElement('div');
      wrapper.className = 'message';
      const heading = quoteCell.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        wrapper.append(heading);
      } else {
        const h4 = document.createElement('h4');
        h4.innerHTML = quoteCell.innerHTML;
        wrapper.append(h4);
      }
      moveInstrumentation(quoteCell, wrapper);
      message.append(wrapper);
    }

    if (nameCell && nameCell.textContent.trim()) {
      const name = document.createElement('div');
      name.className = 'body-text2';
      name.innerHTML = nameCell.innerHTML;
      moveInstrumentation(nameCell, name);
      message.append(name);
    }

    const slide = document.createElement('div');
    slide.className = 'col-md-12';
    slide.append(message);
    moveInstrumentation(row, slide);
    track.append(slide);
  });

  const grid = document.createElement('div');
  grid.className = 'grid';
  grid.append(track);

  block.classList.add('md', 'md-quote-carousel');
  block.classList.add(BACKGROUNDS.includes(background) ? background : 'bg-base');
  block.replaceChildren(grid);

  createCarousel(track, {
    slidesToShowDesktop: 1,
    slidesToShowTablet: 1,
    slidesToShowMobile: 1,
    infinite: true,
    autoplay: false,
    dots: true,
    arrows: true,
    label: ariaLabel || 'Quotes carousel',
  });
}
