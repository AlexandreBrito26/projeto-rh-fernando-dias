(() => {
  const html = document.documentElement;

  // ===== Tema =====
  const THEME_KEY = "fd_rh_theme";
  const themeToggle = document.getElementById("themeToggle");

  const getPreferredTheme = () => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  };

  const applyTheme = (t) => {
    html.setAttribute("data-theme", t);
    localStorage.setItem(THEME_KEY, t);
  };

  applyTheme(getPreferredTheme());

  themeToggle?.addEventListener("click", () => {
    const current = html.getAttribute("data-theme") || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
  });

  // Ano
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== Smooth scroll + menu ativo =====
  const header = document.querySelector(".topbar");
  const headerH = () => (header ? header.getBoundingClientRect().height : 0);

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const y =
        window.scrollY + target.getBoundingClientRect().top - (headerH() + 14);
      window.scrollTo({ top: y, behavior: "smooth" });
      history.pushState(null, "", href);
    });
  });

  const navLinks = Array.from(
    document.querySelectorAll(".nav__link, .nav__pill"),
  ).filter((a) => a.getAttribute("href")?.startsWith("#"));

  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const setActive = () => {
    const pos = window.scrollY + headerH() + 40;
    let currentId = null;
    sections.forEach((sec) => {
      if (sec.offsetTop <= pos) currentId = "#" + sec.id;
    });

    navLinks.forEach((a) => {
      const isActive = a.getAttribute("href") === currentId;
      if (a.classList.contains("nav__link"))
        a.classList.toggle("active", isActive);
    });
  };

  setActive();
  window.addEventListener("scroll", setActive, { passive: true });

  // ===== Reveal =====
  const revealEls = document.querySelectorAll(
    ".card, .h-title, .badge, .hero__title, .hero__subtitle, .btn, .contact",
  );
  revealEls.forEach((el) => el.classList.add("reveal"));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -10% 0px" },
  );

  revealEls.forEach((el) => io.observe(el));

  // ===== Copiar mensagem =====
  const copyBox = document.querySelector(".copybox");
  const copyBtn = document.querySelector("[data-copy='message']");

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    }
  }

  const flash = (el, text) => {
    const old = el.textContent;
    el.textContent = text;
    el.classList.add("flash");
    setTimeout(() => {
      el.classList.remove("flash");
      el.textContent = old;
    }, 1200);
  };

  if (copyBox && copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const ok = await copyText(copyBox.textContent.trim());
      flash(copyBtn, ok ? "Copiado ✅" : "Falhou ❌");
    });
  }

  // ===== Modal =====
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");

  const openModal = ({ title, desc }) => {
    if (!modal) return;
    modalTitle.textContent = title || "Em breve";
    modalDesc.textContent = desc || "Conteúdo em preparação para download.";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-modal='download']");
    if (btn) {
      openModal({
        title: btn.getAttribute("data-title"),
        desc: btn.getAttribute("data-desc"),
      });
      return;
    }
    const close = e.target.closest("[data-close='modal']");
    if (close) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // ===== Contadores =====
  const counters = document.querySelectorAll("[data-count]");
  const animateCount = (el) => {
    const target = Number(el.getAttribute("data-count") || "0");
    const suffix = el.getAttribute("data-suffix") || "";
    const duration = 900;
    const start = performance.now();

    const step = (t) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = Math.round(target * eased);
      el.textContent = `${value}${suffix}`;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const counterIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35 },
  );

  counters.forEach((c) => counterIO.observe(c));

  // ===== Particles (canvas) =====
  const canvas = document.getElementById("particles");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr;
    let particles = [];
    let raf = null;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const rand = (min, max) => Math.random() * (max - min) + min;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.floor(window.innerWidth);
      h = Math.floor(window.innerHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeParticles() {
      const count = Math.max(30, Math.min(60, Math.floor((w * h) / 36000)));
      particles = Array.from({ length: count }).map(() => ({
        x: rand(0, w),
        y: rand(0, h),
        r: rand(1.2, 2.8),
        vx: rand(-0.33, 0.33),
        vy: rand(-0.25, 0.25),
      }));
    }

    function particleColor() {
      const theme = html.getAttribute("data-theme") || "dark";
      return theme === "light" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.22)";
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);

      const c = particleColor();
      ctx.fillStyle = c;
      ctx.strokeStyle = c;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i],
            b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.globalAlpha = (1 - dist / 110) * 0.35;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      raf = requestAnimationFrame(tick);
    }

    function start() {
      if (prefersReduced) return;
      resize();
      makeParticles();
      if (raf) cancelAnimationFrame(raf);
      tick();
    }

    window.addEventListener("resize", () => {
      resize();
      makeParticles();
    });

    start();
  }
})();
