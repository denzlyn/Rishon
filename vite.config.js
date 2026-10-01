import { defineConfig } from 'vite';

// `vite build --mode concept` produces a preview build that is clearly labelled as a design
// concept: a persistent notice, example labels on placeholder case studies, and a form that
// says it isn't connected. Normal builds are unaffected.
function conceptLabels() {
  return {
    name: 'concept-labels',
    transformIndexHtml(html) {
      return html
        .replace(/<title>[^<]*<\/title>/, '<title>Taqniat Redesign Concept</title>')
        .replace('<h2 class="h2 work__title" id="work-title">Selected work</h2>',
          '<h2 class="h2 work__title" id="work-title">Example projects</h2>')
        .replaceAll('<p class="plate__sector">', '<p class="plate__sector">Example project, ')
        .replace('<a class="skip" href="#main">Skip to content</a>',
          '<a class="skip" href="#main">Skip to content</a>\n  <p class="concept-note" role="note">Design concept for Taqniat. Not the official website. Projects and industries are example content.</p>');
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: mode === 'concept' ? [conceptLabels()] : [],
}));
