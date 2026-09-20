(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     Cinematic intro
     - Skips instantly for reduced-motion users
     - Auto-dismisses after its sequence completes
     - Any interaction (click, key, scroll, touch) dismisses early
     ---------------------------------------------------------- */
  const intro = document.getElementById('intro');

  function hideIntro() {
    if (!intro || intro.classList.contains('is-hidden')) return;
    intro.classList.add('is-hidden');
    window.removeEventListener('scroll', hideIntro);
    window.removeEventListener('keydown', hideIntro);
    window.removeEventListener('touchstart', hideIntro);
    document.body.style.overflow = '';
  }

  if (intro) {
    if (prefersReducedMotion) {
      hideIntro();
    } else {
      document.body.style.overflow = 'hidden';
      const autoTimer = setTimeout(() => {
        hideIntro();
        document.body.style.overflow = '';
      }, 2600);

      const dismissEarly = () => {
        clearTimeout(autoTimer);
        hideIntro();
      };
      window.addEventListener('scroll', dismissEarly, { once: true, passive: true });
      window.addEventListener('keydown', dismissEarly, { once: true });
      window.addEventListener('touchstart', dismissEarly, { once: true, passive: true });
      intro.addEventListener('click', dismissEarly, { once: true });
    }
  }

  /* ----------------------------------------------------------
     Ambient background videos
     - Pause and pin to poster frame for reduced-motion users
     ---------------------------------------------------------- */
  document.querySelectorAll('video[autoplay]').forEach((video) => {
    if (prefersReducedMotion) {
      video.removeAttribute('autoplay');
      video.pause();
      video.currentTime = 0;
    }
  });

  /* ----------------------------------------------------------
     Scroll reveal
     ---------------------------------------------------------- */
  const revealEls = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ----------------------------------------------------------
     GCLID Capture & SmartADV Sub3 Tracking (90-day retention)
     ---------------------------------------------------------- */
  const GCLID_STORAGE_KEY = 'lunara_gclid';
  const COOKIE_RETENTION_DAYS = 90;

  function setGclidCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }

  function getGclidCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  }

  function getOrCaptureGclid() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const gclidFromUrl = urlParams.get('gclid');
      if (gclidFromUrl) {
        try {
          localStorage.setItem(GCLID_STORAGE_KEY, gclidFromUrl);
        } catch (e) {}
        setGclidCookie(GCLID_STORAGE_KEY, gclidFromUrl, COOKIE_RETENTION_DAYS);
        return gclidFromUrl;
      }
    } catch (e) {}

    try {
      const gclidFromLocal = localStorage.getItem(GCLID_STORAGE_KEY);
      if (gclidFromLocal) return gclidFromLocal;
    } catch (e) {}

    return getGclidCookie(GCLID_STORAGE_KEY);
  }

  function applyGclidToSmartAdvLinks() {
    const gclid = getOrCaptureGclid();
    if (!gclid) return;

    const ctaSelector = 'a[href*="coralstate.com/36LJDMN5/22SJB3TJ"]';
    const ctaLinks = document.querySelectorAll(ctaSelector);

    ctaLinks.forEach((link) => {
      try {
        const url = new URL(link.href, window.location.origin);
        url.searchParams.set('sub3', gclid);
        link.href = url.toString();
      } catch (e) {}
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyGclidToSmartAdvLinks);
  } else {
    applyGclidToSmartAdvLinks();
  }

  document.addEventListener('click', (e) => {
    const targetLink = e.target.closest('a[href*="coralstate.com/36LJDMN5/22SJB3TJ"]');
    if (targetLink) {
      applyGclidToSmartAdvLinks();
    }
  }, true);
})();
