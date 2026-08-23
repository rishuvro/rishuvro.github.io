(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // V10 nav truth: the hero is an overview, so Work should not look selected at #top.
  const primaryLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
  const work = document.getElementById('work');
  const clearPrematureNavState = () => {
    if (!work) return;
    const threshold = Math.max(180, work.offsetTop - window.innerHeight * .55);
    if (window.scrollY < threshold) primaryLinks.forEach(link => link.classList.remove('is-active'));
  };
  clearPrematureNavState();
  window.addEventListener('scroll', clearPrematureNavState, { passive: true });
  window.addEventListener('hashchange', clearPrematureNavState);

  // Mouse activation should not leave a keyboard-style focus ring stuck on the header.
  if (finePointer) {
    document.querySelectorAll('.site-header a, .site-header button').forEach(el => {
      el.addEventListener('pointerup', () => {
        requestAnimationFrame(() => {
          if (document.activeElement === el) el.blur();
        });
      });
    });
  }

  // Royal light reacts gently to pointer movement, without the tech-neon feeling.
  if (finePointer && !reducedMotion) {
    let tx = innerWidth * .72;
    let ty = innerHeight * .24;
    let x = tx, y = ty;
    window.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const paint = () => {
      x += (tx - x) * .045;
      y += (ty - y) * .045;
      root.style.setProperty('--royal-x', `${x}px`);
      root.style.setProperty('--royal-y', `${y}px`);
      requestAnimationFrame(paint);
    };
    paint();
  }

  // Add a quiet glint to large editorial cards when they enter view.
  const glintTargets = document.querySelectorAll('.project, .career-console, .research-console, .credential-hero, .contact-command');
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('royal-glint');
        setTimeout(() => entry.target.classList.remove('royal-glint'), 1200);
        obs.unobserve(entry.target);
      });
    }, { threshold: .22 });
    glintTargets.forEach(el => obs.observe(el));
  }

  // Keep browser chrome aligned with the Royal Luxe dark/light palette.
  const themeMeta = document.getElementById('theme-color-meta');
  const syncThemeChrome = () => {
    if (!themeMeta) return;
    themeMeta.setAttribute('content', root.dataset.theme === 'light' ? '#f2eee6' : '#080807');
  };
  syncThemeChrome();
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle?.addEventListener('click', () => setTimeout(syncThemeChrome, 0));

  body.dataset.edition = 'V10 Royal Luxe';
})();
