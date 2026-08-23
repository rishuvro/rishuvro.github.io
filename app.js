(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const topbar = document.querySelector('.topbar');
  const progressBar = document.getElementById('progressBar');
  const year = document.getElementById('year');
  const boot = document.getElementById('boot');

  // Theme persistence
  try {
    const saved = localStorage.getItem('ri-v11-theme');
    if (saved) root.dataset.theme = saved;
  } catch (_) {}
  const themeMeta = document.getElementById('theme-color-meta');
  const syncThemeMeta = () => {
    if (themeMeta) themeMeta.content = root.dataset.theme === 'light' ? '#f4f0e8' : '#090a10';
  };
  syncThemeMeta();
  document.getElementById('themeSwitch')?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'night' : 'light';
    try { localStorage.setItem('ri-v11-theme', root.dataset.theme); } catch (_) {}
    syncThemeMeta();
  });

  // Boot
  const closeBoot = () => boot?.classList.add('done');
  if (reduced) closeBoot();
  else setTimeout(closeBoot, document.readyState === 'complete' ? 600 : 900);
  addEventListener('load', () => setTimeout(closeBoot, 380), { once:true });

  if (year) year.textContent = new Date().getFullYear();

  // Scroll state and active navigation
  let ticking = false;
  const navLinks = [...document.querySelectorAll('.topnav a[href^="#"]')];
  const railLinks = [...document.querySelectorAll('.chapter-rail a[href^="#"]')];
  const sections = [...document.querySelectorAll('main section[id]')];
  const setActive = (id) => {
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
    railLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
  };
  const updateScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (progressBar) progressBar.style.transform = `scaleX(${Math.min(1, scrollY / max)})`;
    topbar?.classList.toggle('scrolled', scrollY > 20);

    if (scrollY < innerHeight * .35) setActive('');
    else {
      let best = null;
      sections.forEach(sec => {
        const r = sec.getBoundingClientRect();
        const dist = Math.abs(r.top - 150);
        if (r.bottom > 130 && r.top < innerHeight * .72 && (!best || dist < best.dist)) best = { id: sec.id, dist };
      });
      if (best) setActive(best.id === 'skills' ? 'archive' : best.id);
    }
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); }
  }, { passive:true });
  addEventListener('resize', updateScroll, { passive:true });
  updateScroll();

  // Reveal observer
  const reveals = [...document.querySelectorAll('.reveal')];
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold:.1, rootMargin:'0px 0px -8% 0px' });
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add('in'));

  // Custom cursor + ambient spotlight
  const orb = document.querySelector('.cursor-orb');
  if (fine && !reduced && orb) {
    body.classList.add('has-fine-pointer');
    let x = innerWidth/2, y = innerHeight/2, ox = x, oy = y;
    addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      root.style.setProperty('--mx', `${x}px`);
      root.style.setProperty('--my', `${y}px`);
    }, { passive:true });
    const loop = () => {
      ox += (x-ox) * .2; oy += (y-oy) * .2;
      orb.style.left = `${ox}px`; orb.style.top = `${oy}px`;
      requestAnimationFrame(loop);
    };
    loop();
    document.querySelectorAll('a,button,.portrait-card').forEach(el => {
      el.addEventListener('pointerenter', () => orb.classList.add('is-hot'));
      el.addEventListener('pointerleave', () => orb.classList.remove('is-hot'));
    });
  }

  // Portrait parallax
  const stage = document.getElementById('portraitStage');
  const card = stage?.querySelector('.portrait-card');
  if (stage && card && fine && !reduced) {
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - .5;
      const dy = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `translate3d(${dx*15}px,${dy*10}px,28px) rotateY(${dx*6}deg) rotateX(${dy*-4}deg)`;
    }, { passive:true });
    stage.addEventListener('pointerleave', () => card.style.transform = '');
  }

  // Career active role follows viewport
  const roles = [...document.querySelectorAll('.career-role')];
  if ('IntersectionObserver' in window && roles.length) {
    const careerIo = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          roles.forEach(r => r.classList.toggle('active', r === entry.target));
        }
      });
    }, { threshold:.42, rootMargin:'-15% 0px -35% 0px' });
    roles.forEach(r => careerIo.observe(r));
  }

  // Mobile menu
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  menuToggle?.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!open));
    mobileNav.hidden = open;
  });
  mobileNav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menuToggle?.setAttribute('aria-expanded','false');
    mobileNav.hidden = true;
  }));

  // Same-page anchors with stable top offset
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const hash = a.getAttribute('href');
    if (!hash || hash === '#') return;
    const target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    history.pushState(null,'',hash);
    const top = Math.max(0, scrollY + target.getBoundingClientRect().top - 100);
    scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  }));
  const restoreHash = () => {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    if (!target) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const top = Math.max(0, scrollY + target.getBoundingClientRect().top - 100);
      scrollTo({ top, behavior:'auto' });
    }));
  };
  addEventListener('load', () => setTimeout(restoreHash, 900), { once:true });

  // Command palette
  const command = document.getElementById('command');
  const commandOpen = document.getElementById('commandOpen');
  const commandInput = document.getElementById('commandInput');
  const commandButtons = [...document.querySelectorAll('#commandList button')];
  let lastFocus = null;
  const openCommand = () => {
    lastFocus = document.activeElement;
    command.hidden = false;
    command.setAttribute('aria-hidden','false');
    body.style.overflow = 'hidden';
    commandInput.value = '';
    commandButtons.forEach(b => b.hidden = false);
    setTimeout(() => commandInput.focus(), 30);
  };
  const closeCommand = () => {
    command.hidden = true;
    command.setAttribute('aria-hidden','true');
    body.style.overflow = '';
    lastFocus?.focus?.();
  };
  commandOpen?.addEventListener('click', openCommand);
  document.querySelectorAll('[data-close-command]').forEach(b => b.addEventListener('click', closeCommand));
  addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); command.hidden ? openCommand() : closeCommand(); }
    if (e.key === 'Escape' && !command.hidden) closeCommand();
  });
  commandInput?.addEventListener('input', () => {
    const q = commandInput.value.trim().toLowerCase();
    commandButtons.forEach(b => b.hidden = q && !`${b.dataset.keywords} ${b.textContent}`.toLowerCase().includes(q));
  });
  commandButtons.forEach(b => b.addEventListener('click', () => {
    const hash = b.dataset.href;
    const url = b.dataset.url;
    closeCommand();
    if (hash) {
      history.pushState(null,'',hash);
      const target = document.querySelector(hash);
      if (target) scrollTo({ top:Math.max(0,scrollY+target.getBoundingClientRect().top-100), behavior:reduced?'auto':'smooth' });
    } else if (url) window.open(url,'_blank','noopener');
  }));
})();
