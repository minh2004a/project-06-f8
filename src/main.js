const desktopMedia = window.matchMedia("(min-width: 1024px)");
const activeDotClass =
  "size-3 rounded-full bg-indigo-600 outline-2 outline-offset-4 outline-indigo-600";
const inactiveDotClass = "size-4 rounded-full bg-gray-950/20";
const minSwipeDistance = 50;

function addDesktopChangeListener(callback) {
  if (desktopMedia.addEventListener) {
    desktopMedia.addEventListener("change", callback);
    return;
  }

  if (desktopMedia.addListener) {
    desktopMedia.addListener(callback);
  }
}

function updateDotButtons(dotButtons, activeDotIndex) {
  dotButtons.forEach((dot, dotIndex) => {
    const isActive = dotIndex === activeDotIndex;

    dot.className = isActive ? activeDotClass : inactiveDotClass;
    dot.setAttribute("aria-current", String(isActive));
  });
}

function setupBasicSlider({ trackSelector, dotsSelector }) {
  const track = document.querySelector(trackSelector);
  const dots = document.querySelectorAll(`${dotsSelector} button`);
  const slideCount = track ? track.children.length : 0;

  if (!track || !dots.length || !slideCount) return;

  let activeIndex = 0;

  function setActiveSlide(index) {
    activeIndex = Math.max(0, Math.min(index, slideCount - 1));
    track.style.transform = `translateX(-${activeIndex * 100}%)`;
    updateDotButtons(dots, activeIndex);
  }

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      setActiveSlide(index);
    });
  });

  setActiveSlide(activeIndex);
}

function setupSpecialitySlider() {
  const slider = document.querySelector("#speciality-slider");
  const track = document.querySelector("#speciality-list");
  const dots = document.querySelectorAll("#dots button");
  const originalSlides = track ? Array.from(track.children) : [];
  const slideCount = originalSlides.length;
  const clonedSlides = [];

  let activeIndex = 0;
  let trackIndex = 1;
  let touchStartX = 0;
  let touchStartY = 0;
  let isAnimating = false;
  let transitionFallbackTimer;

  function updateDots() {
    updateDotButtons(dots, activeIndex);
  }

  function getLoopedIndex(index) {
    if (!slideCount) return 0;

    return (index + slideCount) % slideCount;
  }

  function syncCloneVisibility() {
    clonedSlides.forEach((slide) => {
      slide.hidden = desktopMedia.matches;
    });
  }

  function moveTrack({ withTransition = true } = {}) {
    if (!track) return;

    if (desktopMedia.matches) {
      track.style.transition = "";
      track.style.transform = "";
      return;
    }

    track.style.transition = withTransition ? "" : "none";
    track.style.transform = `translateX(-${trackIndex * 100}%)`;
  }

  function jumpToTrackIndex(index) {
    trackIndex = index;
    moveTrack({ withTransition: false });
    track.offsetHeight;
    track.style.transition = "";
  }

  function finishTransition() {
    clearTimeout(transitionFallbackTimer);

    if (trackIndex === 0) {
      jumpToTrackIndex(slideCount);
    }

    if (trackIndex === slideCount + 1) {
      jumpToTrackIndex(1);
    }

    isAnimating = false;
  }

  function startTransitionFallback() {
    clearTimeout(transitionFallbackTimer);
    transitionFallbackTimer = setTimeout(finishTransition, 400);
  }

  function setActiveSlide(index, { withTransition = true } = {}) {
    if (isAnimating) return;

    activeIndex = getLoopedIndex(index);

    const nextTrackIndex = activeIndex + 1;
    const shouldAnimate =
      withTransition && !desktopMedia.matches && nextTrackIndex !== trackIndex;

    trackIndex = nextTrackIndex;
    updateDots();

    if (shouldAnimate) {
      isAnimating = true;
      moveTrack();
      startTransitionFallback();
      return;
    }

    jumpToTrackIndex(trackIndex);
  }

  function showNextSlide() {
    if (isAnimating || desktopMedia.matches) return;

    activeIndex = getLoopedIndex(activeIndex + 1);
    trackIndex += 1;
    isAnimating = true;

    updateDots();
    moveTrack();
    startTransitionFallback();
  }

  function showPreviousSlide() {
    if (isAnimating || desktopMedia.matches) return;

    activeIndex = getLoopedIndex(activeIndex - 1);
    trackIndex -= 1;
    isAnimating = true;

    updateDots();
    moveTrack();
    startTransitionFallback();
  }

  function handleTransitionEnd(event) {
    if (event.target !== track || !event.propertyName.includes("transform")) {
      return;
    }

    finishTransition();
  }

  function handleBreakpointChange() {
    isAnimating = false;
    syncCloneVisibility();
    setActiveSlide(activeIndex, { withTransition: false });
  }

  if (!track || !slider || slideCount < 2) {
    updateDots();
    return;
  }

  const firstClone = originalSlides[0].cloneNode(true);
  const lastClone = originalSlides[slideCount - 1].cloneNode(true);

  [firstClone, lastClone].forEach((clone) => {
    clone.setAttribute("aria-hidden", "true");
    clonedSlides.push(clone);
  });

  track.prepend(lastClone);
  track.append(firstClone);
  slider.style.touchAction = "pan-y";

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      setActiveSlide(index);
    });
  });

  track.addEventListener("transitionend", handleTransitionEnd);
  track.addEventListener("webkitTransitionEnd", handleTransitionEnd);

  slider.addEventListener("touchstart", (event) => {
    if (desktopMedia.matches) return;

    const touch = event.touches[0];

    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  });

  slider.addEventListener(
    "touchmove",
    (event) => {
      if (desktopMedia.matches) return;

      const touch = event.touches[0];
      const distanceX = touch.clientX - touchStartX;
      const distanceY = touch.clientY - touchStartY;
      const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

      if (isHorizontalSwipe && Math.abs(distanceX) > 8) {
        event.preventDefault();
      }
    },
    { passive: false },
  );

  slider.addEventListener("touchend", (event) => {
    if (desktopMedia.matches) return;

    const touch = event.changedTouches[0];
    const distanceX = touch.clientX - touchStartX;
    const distanceY = touch.clientY - touchStartY;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (!isHorizontalSwipe || Math.abs(distanceX) < minSwipeDistance) return;

    if (distanceX < 0) {
      showNextSlide();
    }

    if (distanceX > 0) {
      showPreviousSlide();
    }
  });

  addDesktopChangeListener(handleBreakpointChange);
  syncCloneVisibility();
  jumpToTrackIndex(trackIndex);
  updateDots();
}

function setupMobileMenu() {
  const hamburgerButton = document.querySelector("#hambuger-menu");
  const mobileMenu = document.querySelector("#mobile-menu");
  const mobileMenuOverlay = document.querySelector("#mobile-menu-overlay");
  const mobileMenuCloseButton = document.querySelector("#mobile-menu-close");
  const mobileMenuLinks = document.querySelectorAll("#mobile-menu a");

  if (!hamburgerButton || !mobileMenu || !mobileMenuOverlay) return;

  let closeTimer;

  function openMobileMenu() {
    clearTimeout(closeTimer);
    mobileMenuOverlay.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
    hamburgerButton.setAttribute("aria-expanded", "true");
    mobileMenu.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
      mobileMenuOverlay.classList.remove("opacity-0");
      mobileMenuOverlay.classList.add("opacity-100");
      mobileMenu.classList.remove("-translate-x-full");
      mobileMenu.classList.add("translate-x-0");
    });
  }

  function closeMobileMenu() {
    mobileMenuOverlay.classList.add("opacity-0");
    mobileMenuOverlay.classList.remove("opacity-100");
    mobileMenu.classList.add("-translate-x-full");
    mobileMenu.classList.remove("translate-x-0");
    hamburgerButton.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    document.body.classList.remove("overflow-hidden");

    closeTimer = setTimeout(() => {
      mobileMenuOverlay.classList.add("hidden");
    }, 300);
  }

  hamburgerButton.addEventListener("click", openMobileMenu);
  mobileMenuOverlay.addEventListener("click", closeMobileMenu);
  mobileMenuLinks.forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  if (mobileMenuCloseButton) {
    mobileMenuCloseButton.addEventListener("click", closeMobileMenu);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });

  addDesktopChangeListener(() => {
    if (desktopMedia.matches) {
      closeMobileMenu();
    }
  });
}

function setupIntroVideo() {
  const videoCover = document.querySelector("#videoCover");
  const mainVideo = document.querySelector("#mainVideo");

  if (!videoCover || !mainVideo) return;

  videoCover.addEventListener("click", () => {
    videoCover.classList.add("hidden");
    mainVideo.classList.remove("hidden");
    mainVideo.play();
  });
}

setupSpecialitySlider();
setupBasicSlider({
  trackSelector: "#about-list",
  dotsSelector: "#about-dots",
});
setupMobileMenu();
setupIntroVideo();
