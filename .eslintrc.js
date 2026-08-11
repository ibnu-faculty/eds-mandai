module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:json/recommended',
    'plugin:xwalk/recommended',
  ],
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
    // These models mirror AEM 6.5 components that genuinely expose this many
    // authored fields, so each keeps one cell per field rather than grouping
    // fields an author would then have to disentangle.
    'xwalk/max-cells': ['error', {
      '*': 4,
      'accordion-tabs-tab': 6,
      'conservation-banner': 6,
      'experience-carousel': 8,
      'experience-carousel-slide': 6,
      'feature-carousel': 7,
      'feature-carousel-slide': 6,
      'four-col-listing': 7,
      'four-col-listing-card': 8,
      'masthead-carousel-slide': 16,
      'section-title': 5,
      'social-grid-item': 5,
      'zone-listing-item': 5,
    }],
  },
};
