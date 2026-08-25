(() => {
	// Configuration
	const CONFIG = {
		BREAKPOINTS: {
			MOBILE: 1023.5,
		},
		SELECTORS: {
			body: "body",
			navigation: "#cs-navigation",
			hamburger: "#cs-navigation .cs-toggle",
			menuWrapper: "#cs-ul-wrapper",
			dropdownToggle: ".cs-dropdown-toggle",
			dropdown: ".cs-dropdown",
			dropdownMenu: ".cs-drop-ul",
			topBar: ".cs-top-bar",
			footer: "#footer",
		},
		CLASSES: {
			active: "cs-active",
			menuOpen: "cs-open",
			scroll: "scroll",
			atFooter: "cs-at-footer",
		},
	};

	// DOM Elements
	const elements = {
		body: document.querySelector(CONFIG.SELECTORS.body),
		navigation: document.querySelector(CONFIG.SELECTORS.navigation),
		hamburger: document.querySelector(CONFIG.SELECTORS.hamburger),
		menuWrapper: document.querySelector(CONFIG.SELECTORS.menuWrapper),
		topBar: document.querySelector(CONFIG.SELECTORS.topBar),
		footer: document.querySelector(CONFIG.SELECTORS.footer),
	};

	// Utilities
	const isMobile = () => window.matchMedia(`(max-width: ${CONFIG.BREAKPOINTS.MOBILE}px)`).matches;

	const toggleAttribute = (element, attribute, value1 = "true", value2 = "false") => {
		if (!element) return;
		const current = element.getAttribute(attribute);
		element.setAttribute(attribute, current === value1 ? value2 : value1);
	};

	const toggleInert = (element) => element && (element.inert = !element.inert);

	// Dropdown Management
	const dropdownManager = {
		close(dropdown, shouldFocus = false) {
			if (!dropdown || !dropdown.classList.contains(CONFIG.CLASSES.active)) return false;

			dropdown.classList.remove(CONFIG.CLASSES.active);
			const button = dropdown.querySelector(CONFIG.SELECTORS.dropdownToggle);
			const menu = dropdown.querySelector(CONFIG.SELECTORS.dropdownMenu);

			if (button) {
				button.setAttribute("aria-expanded", "false");
				shouldFocus && button.focus();
			}

			if (menu) {
				menu.inert = true;
			}

			return true;
		},

		toggle(element) {
			element.classList.toggle(CONFIG.CLASSES.active);
			const button = element.querySelector(CONFIG.SELECTORS.dropdownToggle);
			const menu = element.querySelector(CONFIG.SELECTORS.dropdownMenu);

			button && toggleAttribute(button, "aria-expanded");
			menu && toggleInert(menu);
		},

		closeAll() {
			if (!elements.navigation) return false;
			let closed = false;

			elements.navigation.querySelectorAll(`${CONFIG.SELECTORS.dropdown}.${CONFIG.CLASSES.active}`).forEach((dropdown) => {
				this.close(dropdown, true);
				closed = true;
			});

			return closed;
		},
	};

	// Menu Management
	const menuManager = {
		toggle() {
			if (!elements.hamburger || !elements.navigation) return;

			const isClosing = elements.navigation.classList.contains(CONFIG.CLASSES.active);

			[elements.hamburger, elements.navigation].forEach((el) => el.classList.toggle(CONFIG.CLASSES.active));
			elements.body.classList.toggle(CONFIG.CLASSES.menuOpen);
			toggleAttribute(elements.hamburger, "aria-expanded");

			// Only manage inert state on mobile devices
			if (elements.menuWrapper && isMobile()) {
				toggleInert(elements.menuWrapper);
			}

			// When closing the mobile menu, also close any open dropdowns
			isClosing && dropdownManager.closeAll();

			// The menu state feeds the at-footer decision, so re-derive it here:
			// opening the menu over the footer has to bring the bar back.
			footerManager.apply();
		},
	};

	// Keyboard Management
	const keyboardManager = {
		handleEscape() {
			if (!elements.navigation) return;

			// Close any open dropdown menus first
			const dropdownsClosed = dropdownManager.closeAll();
			if (dropdownsClosed) return;

			// Then close hamburger menu if open
			if (elements.hamburger && elements.hamburger.classList.contains(CONFIG.CLASSES.active)) {
				menuManager.toggle();
				elements.hamburger.focus();
			}
		},
	};

	// Event Management
	const eventManager = {
		handleDropdownClick(event) {
			if (!isMobile()) return;

			const button = event.target.closest(CONFIG.SELECTORS.dropdownToggle);
			if (!button) return;

			event.preventDefault();
			const dropdown = button.closest(CONFIG.SELECTORS.dropdown);
			if (dropdown) {
				dropdownManager.toggle(dropdown);
			}
		},

		handleDropdownKeydown(event) {
			if (event.key !== "Enter" && event.key !== " ") return;

			const button = event.target.closest(CONFIG.SELECTORS.dropdownToggle);
			if (!button) return;

			event.preventDefault();
			const dropdown = button.closest(CONFIG.SELECTORS.dropdown);
			if (dropdown) {
				dropdownManager.toggle(dropdown);
			}
		},

		handleFocusOut(event) {
			setTimeout(() => {
				if (!event.relatedTarget) return;

				const dropdown = event.target.closest(CONFIG.SELECTORS.dropdown);
				if (dropdown?.classList.contains(CONFIG.CLASSES.active) && !dropdown.contains(event.relatedTarget)) {
					dropdownManager.close(dropdown);
				}
			}, 10);
		},

		handleMobileFocus(event) {
			if (!isMobile() || !elements.navigation.classList.contains(CONFIG.CLASSES.active)) return;
			if (elements.menuWrapper.contains(event.target) || elements.hamburger.contains(event.target)) return;

			menuManager.toggle();
		},

		handleDropdownHover(event) {
			if (isMobile()) return; // Only apply hover behavior on desktop

			const dropdown = event.target.closest(CONFIG.SELECTORS.dropdown);
			if (!dropdown) return;

			const menu = dropdown.querySelector(CONFIG.SELECTORS.dropdownMenu);
			if (!menu) return;

			if (event.type === "mouseenter") {
				menu.inert = false;
			} else if (event.type === "mouseleave") {
				// Only set inert=true if mouse is leaving the entire dropdown area
				// Use setTimeout to allow mouseleave/mouseenter events to complete
				setTimeout(() => {
					// Check if mouse is still over the dropdown or its menu
					if (!dropdown.matches(':hover')) {
						menu.inert = true;
					}
				}, 1);
			}
		},
	};

	// Footer Management
	//
	// Slide the fixed bar out of the way once the footer is on screen. #footer
	// opens with .cs-cta, the site's only closing ask, and by then the footer
	// already carries every nav link plus a Get started button - so the bar is
	// covering the closing headline while duplicating what is visible below it.
	//
	// An IntersectionObserver, NOT a scroll threshold: the overlap depends on
	// viewport HEIGHT, not scroll depth (measured at max scroll 2026-08-24 -
	// 1512x831 buried 52px of the headline, 1280x800 buried 64px, 1440x900
	// cleared it). A pixel threshold would reproduce the inconsistency it fixes.
	const footerManager = {
		footerInView: false,

		// Re-derived from both inputs every time, so neither can strand the other.
		apply() {
			if (!elements.navigation) return;

			// Never hide a nav whose mobile menu is open, or the open menu slides
			// off the top with it and the toggle goes with it.
			const menuOpen = elements.navigation.classList.contains(CONFIG.CLASSES.active);
			const hide = this.footerInView && !menuOpen;

			elements.navigation.classList.toggle(CONFIG.CLASSES.atFooter, hide);

			// A bar parked off-screen must not stay in the tab order, or a keyboard
			// user tabs into something they cannot see. The skip link lives outside
			// #cs-navigation, so it is unaffected.
			elements.navigation.inert = hide;
		},

		init() {
			// No footer, or no observer support: leave the bar exactly as it was.
			if (!elements.footer || !elements.navigation || !("IntersectionObserver" in window)) return;

			// Root shrunk to the top quarter of the viewport, so the bar leaves as
			// the footer reaches the band it would collide in rather than the
			// moment a single pixel of footer appears at the bottom of the screen.
			// A fraction, not a pixel count, so it scales with viewport height -
			// which is the variable causing the problem in the first place.
			new IntersectionObserver(
				(entries) => {
					this.footerInView = entries[0].isIntersecting;
					this.apply();
				},
				{ rootMargin: "0px 0px -75% 0px", threshold: 0 }
			).observe(elements.footer);
		},
	};

	// Scroll Effects Management
	const scrollManager = {
		handleScrollEffects() {
			const scrollPosition = document.documentElement.scrollTop;
			const isScrolled = scrollPosition >= 100;

			elements.body.classList.toggle(CONFIG.CLASSES.scroll, isScrolled);

			// Make whole top bar inert when scrolled
			if (elements.topBar) elements.topBar.inert = isScrolled;
		},
	};

	// Initialization & Setup
	const init = {
		inertState() {
			if (!elements.menuWrapper) return;

			// On mobile, menu starts closed, so set inert=true
			// On desktop, menu is always visible, so set inert=false
			elements.menuWrapper.inert = isMobile();

			// Initialize dropdown menus - they start closed, so inert=true on all devices
			if (elements.navigation) {
				const dropdownMenus = elements.navigation.querySelectorAll(CONFIG.SELECTORS.dropdownMenu);
				dropdownMenus.forEach((dropdown) => {
					dropdown.inert = true;
				});
			}
		},

		eventListeners() {
			if (!elements.hamburger || !elements.navigation) return;

			// Hamburger menu
			elements.hamburger.addEventListener("click", menuManager.toggle);
			elements.navigation.addEventListener("click", (e) => {
				if (e.target === elements.navigation && elements.navigation.classList.contains(CONFIG.CLASSES.active)) {
					menuManager.toggle();
				}
			});

			// Dropdown delegation
			elements.navigation.addEventListener("click", eventManager.handleDropdownClick);
			elements.navigation.addEventListener("keydown", eventManager.handleDropdownKeydown);
			elements.navigation.addEventListener("focusout", eventManager.handleFocusOut);

			// Desktop hover listeners for inert management
			elements.navigation.addEventListener("mouseenter", eventManager.handleDropdownHover, true);
			elements.navigation.addEventListener("mouseleave", eventManager.handleDropdownHover, true);

			// Global events
			document.addEventListener("keydown", (e) => e.key === "Escape" && keyboardManager.handleEscape());
			document.addEventListener("focusin", eventManager.handleMobileFocus);
			document.addEventListener("scroll", () => scrollManager.handleScrollEffects());

			// Resize handling
			window.addEventListener("resize", () => {
				this.inertState();
				if (!isMobile() && elements.navigation.classList.contains(CONFIG.CLASSES.active)) {
					menuManager.toggle();
				}
			});
		},
	};

	// Initialize navigation system
	init.inertState();
	init.eventListeners();
	footerManager.init();
})();
                                