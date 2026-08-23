(() => {
  const root = document.documentElement;
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Theme
  let savedTheme = null;
  const systemLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  try { savedTheme = localStorage.getItem('ri-theme'); } catch (_) {}
  root.dataset.theme = savedTheme || (systemLight ? 'light' : 'dark');
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('ri-theme', root.dataset.theme); } catch (_) {}
  });

  // Header + mobile navigation
  const header = document.querySelector('.site-header');
  const menuButton = document.getElementById('menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 18);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    mobileMenu.hidden = open;
  });
  mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    mobileMenu.hidden = true;
  }));

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in-view'));
  }

  // Cursor + ambient spotlight
  let mouseX = innerWidth / 2;
  let mouseY = innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');

  if (finePointer && !reducedMotion && dot && ring) {
    body.classList.add('cursor-ready');
    window.addEventListener('mousemove', e => {
      mouseX = e.clientX; mouseY = e.clientY;
      root.style.setProperty('--mx', `${mouseX}px`);
      root.style.setProperty('--my', `${mouseY}px`);
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    }, { passive: true });

    const cursorLoop = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(cursorLoop);
    };
    cursorLoop();

    document.querySelectorAll('a,button,.tilt-card').forEach(el => {
      el.addEventListener('mouseenter', () => body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => body.classList.remove('cursor-hover'));
    });
  }

  // Magnetic buttons
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * .12}px, ${y * .12}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    document.querySelectorAll('.tilt-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * 100;
        const py = ((e.clientY - r.top) / r.height) * 100;
        card.style.setProperty('--px', `${px}%`);
        card.style.setProperty('--py', `${py}%`);
        const rx = ((e.clientY - r.top) / r.height - .5) * -3;
        const ry = ((e.clientX - r.left) / r.width - .5) * 3;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  // Portrait parallax
  const stage = document.getElementById('identity-stage');
  const portrait = stage?.querySelector('.portrait-frame');
  if (stage && portrait && finePointer && !reducedMotion) {
    stage.addEventListener('mousemove', e => {
      const r = stage.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - .5;
      const dy = (e.clientY - r.top) / r.height - .5;
      portrait.style.transform = `translate3d(${dx * 14}px, ${dy * 10}px, 30px) rotateY(${dx * 4}deg) rotateX(${dy * -3}deg)`;
    });
    stage.addEventListener('mouseleave', () => { portrait.style.transform = 'translateZ(30px)'; });
  }

  // Animated signal canvas
  const canvas = document.getElementById('signal-canvas');
  if (canvas && !reducedMotion) {
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, dpr = Math.min(devicePixelRatio || 1, 1.7), nodes = [];
    const css = () => getComputedStyle(root);

    const resize = () => {
      width = innerWidth; height = innerHeight;
      canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const count = Math.max(20, Math.min(54, Math.round(width * height / 30000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width, y: Math.random() * height,
        vx: (Math.random() - .5) * .16, vy: (Math.random() - .5) * .16,
        r: Math.random() * 1.2 + .5
      }));
    };
    resize();
    window.addEventListener('resize', resize, { passive:true });

    const draw = () => {
      ctx.clearRect(0,0,width,height);
      const style = css();
      const line = style.getPropertyValue('--line-strong').trim() || 'rgba(255,255,255,.18)';
      const accent = style.getPropertyValue('--accent-2').trim() || '#9bc8ff';
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < -10 || n.x > width + 10) n.vx *= -1;
        if (n.y < -10 || n.y > height + 10) n.vy *= -1;
      });
      for (let i=0;i<nodes.length;i++) {
        for (let j=i+1;j<nodes.length;j++) {
          const a=nodes[i], b=nodes[j], dx=a.x-b.x, dy=a.y-b.y, dist=Math.hypot(dx,dy);
          if (dist < 150) {
            ctx.globalAlpha = (1 - dist/150) * .28;
            ctx.strokeStyle = line; ctx.lineWidth = .65; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = .42;
      ctx.fillStyle = accent;
      nodes.forEach(n => { ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fill(); });
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    };
    draw();
  }

  document.getElementById('year').textContent = new Date().getFullYear();
})();

// V3 cinematic polish: load sequence, scroll intelligence and interaction labels.
(() => {
  const root = document.documentElement;
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Short branded boot sequence. It never blocks reduced-motion users.
  const boot = document.getElementById('boot-screen');
  const finishBoot = () => {
    boot?.classList.add('is-done');
    body.classList.remove('is-loading');
    window.setTimeout(() => boot?.remove(), 800);
  };
  if (reducedMotion) {
    finishBoot();
  } else {
    // Guarantee dismissal even if load fires before this deferred script executes.
    const wait = document.readyState === 'complete' ? 920 : 1080;
    window.setTimeout(finishBoot, wait);
    window.addEventListener('load', () => window.setTimeout(finishBoot, 720), { once: true });
  }

  // Page progress + subtle hero scroll choreography.
  const progress = document.getElementById('scroll-progress-bar');
  const hero = document.querySelector('.hero');
  const heroLines = [...document.querySelectorAll('.display-line')];
  let ticking = false;
  const updateScrollScene = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / max));
    if (progress) progress.style.transform = `scaleX(${ratio})`;

    if (!reducedMotion && hero && window.innerWidth > 900) {
      const heroRect = hero.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -heroRect.top / Math.max(1, heroRect.height * .72)));
      heroLines.forEach((line, index) => {
        const drift = p * (index + 1) * 7;
        line.style.transform = `translate3d(${drift}px, ${p * -4}px, 0)`;
      });
      hero.style.setProperty('--hero-scroll', p.toFixed(3));
    } else {
      heroLines.forEach(line => { line.style.transform = ''; });
    }
    ticking = false;
  };
  const requestScrollScene = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateScrollScene);
    }
  };
  updateScrollScene();
  window.addEventListener('scroll', requestScrollScene, { passive: true });
  window.addEventListener('resize', requestScrollScene, { passive: true });

  // Active chapter in the primary navigation.
  const navLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
  const navTargets = navLinks
    .map(link => ({ link, target: document.querySelector(link.getAttribute('href')) }))
    .filter(item => item.target);
  if ('IntersectionObserver' in window && navTargets.length) {
    const activeMap = new Map();
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => activeMap.set(entry.target.id, entry.intersectionRatio));
      let best = null;
      navTargets.forEach(item => {
        const score = activeMap.get(item.target.id) || 0;
        if (!best || score > best.score) best = { ...item, score };
      });
      if (best && best.score > 0) {
        navLinks.forEach(link => link.classList.toggle('is-active', link === best.link));
      }
    }, { threshold: [0, .12, .3, .55, .8], rootMargin: '-24% 0px -58% 0px' });
    navTargets.forEach(item => navObserver.observe(item.target));
  }

  // Personal signal stage: all layers respond together but at different depths.
  const stage = document.getElementById('identity-stage');
  if (stage && finePointer && !reducedMotion) {
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - .5) * 2;
      const y = ((e.clientY - r.top) / r.height - .5) * 2;
      stage.style.setProperty('--stage-x', x.toFixed(3));
      stage.style.setProperty('--stage-y', y.toFixed(3));
    }, { passive: true });
    stage.addEventListener('pointerleave', () => {
      stage.style.setProperty('--stage-x', '0');
      stage.style.setProperty('--stage-y', '0');
    });
  }

  // Project spotlight follows the pointer even on the large non-tilting feature card.
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('.project').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--px', `${((e.clientX-r.left)/r.width)*100}%`);
        card.style.setProperty('--py', `${((e.clientY-r.top)/r.height)*100}%`);
      }, { passive:true });
    });
  }

  // Cursor action mode for portfolio objects.
  const cursorLabel = document.querySelector('.cursor-label');
  if (finePointer && !reducedMotion && cursorLabel) {
    let labelX = innerWidth / 2, labelY = innerHeight / 2;
    let tx = labelX, ty = labelY;
    window.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive:true });
    const labelLoop = () => {
      labelX += (tx - labelX) * .2;
      labelY += (ty - labelY) * .2;
      cursorLabel.style.left = `${labelX}px`;
      cursorLabel.style.top = `${labelY}px`;
      requestAnimationFrame(labelLoop);
    };
    labelLoop();
    document.querySelectorAll('.cursor-view').forEach(item => {
      item.addEventListener('pointerenter', () => {
        cursorLabel.textContent = item.dataset.cursorLabel || 'VIEW';
        body.classList.add('cursor-action');
      });
      item.addEventListener('pointerleave', () => body.classList.remove('cursor-action'));
    });
  }

  // Pause expensive ambience while the tab is not visible.
  document.addEventListener('visibilitychange', () => {
    body.classList.toggle('page-hidden', document.hidden);
  });
})();


// V4: deterministic anchor navigation + section dock.
(() => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const dock = document.getElementById('chapter-dock');
  const dockLinks = [...document.querySelectorAll('.chapter-dock a[href^="#"]')];
  const dockNumber = document.getElementById('chapter-dock-number');
  const dockLabel = document.getElementById('chapter-dock-label');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const headerOffset = () => Math.max(72, (header?.getBoundingClientRect().height || 70) + 28);
  const targetFromHash = hash => {
    if (!hash || hash === '#') return null;
    try { return document.querySelector(hash); } catch (_) { return null; }
  };

  const flashTarget = target => {
    if (!target || !target.matches('section')) return;
    target.classList.remove('hash-target-flash');
    void target.offsetWidth;
    target.classList.add('hash-target-flash');
    window.setTimeout(() => target.classList.remove('hash-target-flash'), 1400);
  };

  const scrollToTarget = (target, behavior = 'smooth', flash = false) => {
    if (!target) return;
    if (target.id === 'top') {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : behavior });
      return;
    }
    const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - headerOffset());
    window.scrollTo({ top, behavior: reducedMotion ? 'auto' : behavior });
    if (flash) flashTarget(target);
  };

  // Own same-page anchors so header offset and the intro animation never break deep links.
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const hash = link.getAttribute('href');
      const target = targetFromHash(hash);
      if (!target) return;
      e.preventDefault();
      history.pushState(null, '', hash);
      scrollToTarget(target, 'smooth', true);
    });
  });

  const restoreHash = (flash = false) => {
    const target = targetFromHash(location.hash);
    if (!target) return;
    // Two frames lets fonts/images and the boot overlay settle first.
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToTarget(target, 'auto', flash)));
  };

  window.addEventListener('hashchange', () => restoreHash(true));
  window.addEventListener('load', () => {
    if (location.hash) {
      restoreHash(false);
      setTimeout(() => restoreHash(false), 850);
      setTimeout(() => restoreHash(false), 1450);
    }
  }, { once: true });

  // The fixed dock follows all major chapters, including sections omitted from the top nav.
  if (dock && dockLinks.length && 'IntersectionObserver' in window) {
    const entriesMap = new Map();
    const items = dockLinks.map(link => ({
      link,
      target: targetFromHash(link.getAttribute('href')),
      number: link.dataset.chapter || '',
      label: link.dataset.label || ''
    })).filter(x => x.target);

    const setActive = item => {
      dockLinks.forEach(link => link.classList.toggle('is-active', link === item.link));
      if (dockNumber) dockNumber.textContent = item.number;
      if (dockLabel) dockLabel.textContent = item.label.toUpperCase();
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entriesMap.set(entry.target.id, entry.intersectionRatio));
      let best = null;
      items.forEach(item => {
        const r = item.target.getBoundingClientRect();
        const visible = entriesMap.get(item.target.id) || 0;
        const distance = Math.abs(r.top - headerOffset());
        const score = visible * 1000 - distance * .05;
        if (!best || score > best.score) best = { item, score };
      });
      if (best) setActive(best.item);
    }, { threshold:[0,.05,.15,.3,.55,.8], rootMargin:'-10% 0px -62% 0px' });
    items.forEach(item => observer.observe(item.target));
  }

  const updateSafeOffset = () => root.style.setProperty('--header-safe', `${Math.round(headerOffset())}px`);
  updateSafeOffset();
  window.addEventListener('resize', updateSafeOffset, { passive:true });
})();

// V5: selected-work filtering and project-index feedback.
(() => {
  const filters = [...document.querySelectorAll('.work-filter[data-filter]')];
  const projects = [...document.querySelectorAll('#project-grid > .project[data-category]')];
  const count = document.getElementById('work-visible-count');
  if (!filters.length || !projects.length) return;

  const applyFilter = (filter) => {
    let visible = 0;
    projects.forEach((project) => {
      const categories = (project.dataset.category || '').split(/\s+/).filter(Boolean);
      const show = filter === 'all' || categories.includes(filter);
      project.classList.toggle('is-filtered-out', !show);
      if (show) {
        visible += 1;
        project.classList.remove('is-filter-enter');
        void project.offsetWidth;
        project.classList.add('is-filter-enter');
      }
    });
    if (count) count.textContent = String(visible).padStart(2, '0');
  };

  filters.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter || 'all';
      filters.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      applyFilter(filter);
    });
  });
})();

// V6: interactive career story console.
(() => {
  const tabs = [...document.querySelectorAll('.career-tab[data-career]')];
  const panels = [...document.querySelectorAll('.career-panel[data-career-panel]')];
  if (!tabs.length || !panels.length) return;

  const activate = key => {
    tabs.forEach(tab => {
      const active = tab.dataset.career === key;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    panels.forEach(panel => {
      const active = panel.dataset.careerPanel === key;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
  };

  tabs.forEach(tab => tab.addEventListener('click', () => activate(tab.dataset.career)));
})();
