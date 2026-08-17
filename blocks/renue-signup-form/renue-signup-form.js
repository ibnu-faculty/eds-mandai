import { loadRenueTheme, optimizePicture } from '../../scripts/renue.js';

/*
 * Re:Nue Community Signup block. Field order: image, heading, copy,
 * consentText, submitLabel.
 * The actual form fields (full name, email/mobile toggle, consent checkbox)
 * are a fixed product requirement, not author-editable — only the
 * surrounding copy/image/labels are. If this needs to submit to a real
 * endpoint (e.g. HubSpot CRM per the project brief), wire that up in the
 * form's submit handler below.
 */
export default async function decorate(block) {
  await loadRenueTheme();

  const [imageRow, headingRow, copyRow, consentRow, submitLabelRow] = [...block.children];

  const picture = imageRow?.querySelector('picture');
  if (picture) optimizePicture(picture);
  const headingEl = headingRow?.firstElementChild || headingRow;
  const copyEl = copyRow?.firstElementChild || copyRow;
  const consentEl = consentRow?.firstElementChild || consentRow;
  const submitLabel = submitLabelRow?.textContent?.trim() || 'Join now';

  const media = document.createElement('figure');
  media.className = 'renue-signup-form__media';
  if (picture) media.append(picture);

  const content = document.createElement('div');
  content.className = 'renue-signup-form__content';

  if (headingEl) {
    const h2 = document.createElement('h2');
    h2.className = 'renue-signup-form__heading';
    h2.append(...headingEl.childNodes);
    content.append(h2);
  }
  if (copyEl) {
    copyEl.classList.add('renue-signup-form__copy');
    content.append(copyEl);
  }

  const form = document.createElement('form');
  form.className = 'renue-signup-form__form';
  form.setAttribute('novalidate', '');
  form.innerHTML = `
    <label class="renue-signup-form__field">
      <span class="renue-sr-only">Full name</span>
      <input type="text" name="fullName" placeholder="Full name" required>
    </label>
    <fieldset class="renue-signup-form__signup-method">
      <legend>Sign up with:</legend>
      <label><input type="radio" name="signupMethod" value="email" checked> Email</label>
      <label><input type="radio" name="signupMethod" value="mobile"> Mobile number</label>
    </fieldset>
    <label class="renue-signup-form__field">
      <span class="renue-sr-only">Enter your email address</span>
      <input type="email" name="contactValue" placeholder="Enter your email address" required>
    </label>
  `;

  const consentLabel = document.createElement('label');
  consentLabel.className = 'renue-signup-form__consent';
  const consentCheckbox = document.createElement('input');
  consentCheckbox.type = 'checkbox';
  consentCheckbox.name = 'consent';
  consentCheckbox.required = true;
  consentLabel.append(consentCheckbox);
  if (consentEl) {
    consentLabel.append(consentEl);
  } else {
    const span = document.createElement('span');
    span.textContent = "By registering through this promotional application form, you agree that The Salvation Army Red Shield Industries (the Society) can use, disclose and process your personal information in this application form in accordance with the Society's Data Protection Policy.";
    consentLabel.append(span);
  }
  form.append(consentLabel);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'renue-btn renue-btn--dark renue-signup-form__submit';
  submit.textContent = submitLabel;
  form.append(submit);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // TODO: wire to the real CRM endpoint (HubSpot, per the project brief).
    // eslint-disable-next-line no-console
    console.info('[renue-signup-form] submit (not yet wired to a backend)', new FormData(form));
  });

  content.append(form);

  block.innerHTML = '';
  block.append(media, content);
}
