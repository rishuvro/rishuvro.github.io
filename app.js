(() => {
  const root = document.documentElement;
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Theme
  const savedTheme = localStorage.getItem('ri-theme');
  const systemLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  root.dataset.theme = savedTheme || (systemLight ? 'light' : 'dark');
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('ri-theme', root.dataset.theme);
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
