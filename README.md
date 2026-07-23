# Ian Liu's website

This repository contains the source for [ianyliu.github.io](https://ianyliu.github.io/).
It is a static Jekyll site based on the Academic Pages theme. Markdown and YAML
hold the content; Liquid layouts, Sass, and a small JavaScript bundle provide
the presentation and interactions.

## Development

The supported toolchain is Ruby 3.2, Node.js 18 or newer, Bundler 2.4, and npm
9 or newer.

```bash
bundle install
npm ci
bundle exec jekyll serve --livereload
```

The local site is available at <http://localhost:4000>. To use the container:

```bash
docker compose up --build
```

The container runs as a non-root user. Do not change repository permissions
recursively.

## Content

- `_pages/about.md` is the homepage.
- `_publications/`, `_portfolio/`, and `_teaching/` contain published entries.
- `_data/navigation.yml` controls the masthead.
- `_config.yml` contains author metadata and site-wide behavior.
- `files/IanLiu_CV.pdf` is the CV linked from the masthead.

Retained Academic Pages examples are marked `published: false`. They remain as
references without appearing in the generated site or sitemap.

## Styling and JavaScript

The Sass entrypoint is `assets/css/main.scss`. Motion rules live in
`_sass/layout/_motion.scss`; the cinematic overlay is scoped to the homepage
and has a `prefers-reduced-motion` fallback.

Edit JavaScript in `assets/js/_main.js` or
`assets/js/plugins/jquery.greedy-navigation.js`, then regenerate the committed
bundle:

```bash
npm run build:js
```

`npm test` verifies syntax and fails when `assets/js/main.min.js` is not in sync
with its sources.

The homepage cinematic runs once per browser session, respects reduced-motion
preferences, and provides Skip and Replay controls. Its browser behavior is
covered with Playwright:

```bash
npx playwright install --with-deps chromium
npm run test:browser
```

## Validation

Before publishing, run:

```bash
npm test
bundle exec jekyll build --trace
bundle exec jekyll doctor
bundle exec ruby scripts/verify_site.rb
npm run test:browser
```

The same checks run in GitHub Actions. The generated `_site/` directory and
local dependency folders are intentionally ignored.

## Optional generators

The `markdown_generator/` directory retains TSV, BibTeX, and notebook helpers
from Academic Pages. The talk-map workflow watches `_talks/` and commits only
its generated map files. The JSON CV helper can be run non-interactively:

```bash
scripts/update_cv_json.sh
scripts/update_cv_json.sh --build
```

The public navigation links directly to Google Scholar and the PDF CV, so the
retained Markdown/JSON CV examples are not published.

## Deployment

GitHub Pages builds the `master` branch. Keep content changes and generated
assets in reviewable commits, run the validation suite, and push only a clean
build.

## Credits

The site is derived from
[Academic Pages](https://github.com/academicpages/academicpages.github.io),
which in turn is based on Minimal Mistakes. See [LICENSE](LICENSE) for license
details.
