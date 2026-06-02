const specialityList = document.querySelector("#speciality-list");
const dots = document.querySelectorAll("#dots button");
const desktopMedia = window.matchMedia("(min-width: 1024px)");
const hamburgerButton = document.querySelector("#hambuger-menu");
const mobileMenu = document.querySelector("#mobile-menu");
const mobileMenuOverlay = document.querySelector("#mobile-menu-overlay");
const mobileMenuCloseButton = document.querySelector("#mobile-menu-close");
const mobileMenuLinks = document.querySelectorAll("#mobile-menu a");

const activeDotClass =
  "size-3 rounded-full bg-indigo-600 outline-2 outline-offset-4 outline-indigo-600";
const inactiveDotClass = "size-4 rounded-full bg-gray-950/20";
const minSwipeDistance = 50;

const originalCards = specialityList
  ? Array.from(specialityList.children)
  : [];
const slideCount = originalCards.length;
const clonedCards = [];

let activeIndex = 0;
let trackIndex = 1;
let touchStartX = 0;
let touchStartY = 0;
let isAnimating = false;
let mobileMenuCloseTimer;

function openMobileMenu() {
  if (!hamburgerButton || !mobileMenu || !mobileMenuOverlay) return;

  clearTimeout(mobileMenuCloseTimer);
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
  if (!hamburgerButton || !mobileMenu || !mobileMenuOverlay) return;

  mobileMenuOverlay.classList.add("opacity-0");
  mobileMenuOverlay.classList.remove("opacity-100");
  mobileMenu.classList.add("-translate-x-full");
  mobileMenu.classList.remove("translate-x-0");
  hamburgerButton.setAttribute("aria-expanded", "false");
  mobileMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("overflow-hidden");

  mobileMenuCloseTimer = setTimeout(() => {
    mobileMenuOverlay.classList.add("hidden");
  }, 300);
}

function setupInfiniteCards() {
  if (!specialityList || slideCount < 2) return;

  const firstClone = originalCards[0].cloneNode(true);
  const lastClone = originalCards[slideCount - 1].cloneNode(true);

  [firstClone, lastClone].forEach((clone) => {
    clone.setAttribute("aria-hidden", "true");
    clonedCards.push(clone);
  });

  specialityList.prepend(lastClone);
  specialityList.append(firstClone);
  specialityList.style.touchAction = "pan-y";
}

function syncCloneVisibility() {
  clonedCards.forEach((card) => {
    card.hidden = desktopMedia.matches;
  });
}

function updateDots() {
  dots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === activeIndex;

    dot.className = isActive ? activeDotClass : inactiveDotClass;
    dot.setAttribute("aria-current", String(isActive));
  });
}

function moveSpecialityList({ withTransition = true } = {}) {
  if (!specialityList) return;

  if (desktopMedia.matches) {
    specialityList.style.transition = "";
    specialityList.style.transform = "";
    return;
  }

  specialityList.style.transition = withTransition ? "" : "none";
  specialityList.style.transform = `translateX(-${trackIndex * 100}%)`;
}

function jumpToTrackIndex(index) {
  trackIndex = index;
  moveSpecialityList({ withTransition: false });
  specialityList.offsetHeight;
  specialityList.style.transition = "";
}

function getLoopedIndex(index) {
  if (!slideCount) return 0;

  return (index + slideCount) % slideCount;
}

function setActiveCard(index, { withTransition = true } = {}) {
  if (isAnimating) return;

  activeIndex = getLoopedIndex(index);
  const nextTrackIndex = activeIndex + 1;
  const shouldAnimate =
    withTransition && !desktopMedia.matches && nextTrackIndex !== trackIndex;

  trackIndex = nextTrackIndex;
  updateDots();

  if (shouldAnimate) {
    isAnimating = true;
    moveSpecialityList();
    return;
  }

  jumpToTrackIndex(trackIndex);
}

function showNextCard() {
  if (isAnimating || desktopMedia.matches) return;

  activeIndex = getLoopedIndex(activeIndex + 1);
  trackIndex += 1;
  isAnimating = true;

  updateDots();
  moveSpecialityList();
}

function showPreviousCard() {
  if (isAnimating || desktopMedia.matches) return;

  activeIndex = getLoopedIndex(activeIndex - 1);
  trackIndex -= 1;
  isAnimating = true;

  updateDots();
  moveSpecialityList();
}

function handleTransitionEnd(event) {
  if (event.target !== specialityList || event.propertyName !== "transform") {
    return;
  }

  if (trackIndex === 0) {
    jumpToTrackIndex(slideCount);
  }

  if (trackIndex === slideCount + 1) {
    jumpToTrackIndex(1);
  }

  isAnimating = false;
}

function handleBreakpointChange() {
  isAnimating = false;
  syncCloneVisibility();
  setActiveCard(activeIndex, { withTransition: false });
}

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    setActiveCard(index);
  });
});

if (specialityList && slideCount > 1) {
  setupInfiniteCards();
  syncCloneVisibility();
  jumpToTrackIndex(trackIndex);
  updateDots();

  specialityList.addEventListener("transitionend", handleTransitionEnd);

  specialityList.addEventListener("touchstart", (event) => {
    if (desktopMedia.matches) return;

    const touch = event.touches[0];

    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  });

  specialityList.addEventListener("touchend", (event) => {
    if (desktopMedia.matches) return;

    const touch = event.changedTouches[0];
    const distanceX = touch.clientX - touchStartX;
    const distanceY = touch.clientY - touchStartY;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (!isHorizontalSwipe || Math.abs(distanceX) < minSwipeDistance) return;

    if (distanceX < 0) {
      showNextCard();
    }

    if (distanceX > 0) {
      showPreviousCard();
    }
  });

  desktopMedia.addEventListener("change", handleBreakpointChange);
} else {
  updateDots();
}

hamburgerButton?.addEventListener("click", openMobileMenu);
mobileMenuCloseButton?.addEventListener("click", closeMobileMenu);
mobileMenuOverlay?.addEventListener("click", closeMobileMenu);

mobileMenuLinks.forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileMenu();
  }
});

desktopMedia.addEventListener("change", () => {
  if (desktopMedia.matches) {
    closeMobileMenu();
  }
});
