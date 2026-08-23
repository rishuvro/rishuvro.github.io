# Rakibul Islam Portfolio — Rebuild

A dependency-light static portfolio rebuilt for GitHub Pages.

## Files
- `index.html` — structure, SEO metadata and content
- `styles.css` — responsive visual system and animations
- `app.js` — canvas signal field, reveal animations, custom cursor, theme and mobile navigation
- `assets/` — profile, CV, certificates, social card and favicon
- `404.html` — custom GitHub Pages 404
- `robots.txt` / `sitemap.xml` — search-engine basics

## Deploy to GitHub Pages
1. Back up the current repository.
2. Replace the current root files with the contents of this folder.
3. Commit and push to the `main` branch.
4. In **GitHub → Settings → Pages**, use **Deploy from a branch → main → /(root)**.
5. Wait for GitHub Pages to finish deployment, then hard-refresh `https://rishuvro.github.io/`.

No build command is required.

## Notes
- Animations automatically reduce when the visitor enables reduced motion.
- Mobile layouts have dedicated breakpoints.
- The design has no Tailwind or Font Awesome runtime dependency.
- Certificate PDFs are stored locally in `assets/` so the portfolio remains self-contained.
