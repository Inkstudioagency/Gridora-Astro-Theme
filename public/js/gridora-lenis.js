/**
 * Smooth scrolling, driven by GSAP's ticker.
 *
 * Lenis must not run its own requestAnimationFrame loop: with two independent
 * loops, ScrollTrigger can miss updates mid-scroll and triggers below the fold
 * silently never fire (they only work after a reload, which starts them past
 * their trigger point). Feeding Lenis from gsap.ticker and pushing every Lenis
 * scroll into ScrollTrigger.update keeps the two in lockstep.
 */
window.GridoraFX = window.GridoraFX || [];
window.GridoraFX.push(function () {
  if (typeof Lenis === "undefined" || !window.matchMedia("(min-width:768px)").matches) return;

  const lenis = new Lenis({
    duration: 0.8,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    smoothWheel: true,
    smoothTouch: false,
    allowNestedScroll: true,
  });

  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();
  } else {
    // GSAP is not on the page - fall back to a standalone loop.
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  window.lenis = lenis;
});
