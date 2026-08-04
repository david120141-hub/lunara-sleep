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
})();
