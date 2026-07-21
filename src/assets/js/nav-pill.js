/**
 * Traveling nav pill.
 *
 * A single coral pill rests behind the "Get a quote" button and slides to
 * whichever nav link is hovered or focused, overshooting with a spring before
 * it settles. As it travels it stretches like a water droplet (elongates along
 * the direction of travel, thins through the middle, then rebounds round). When
 * the pointer leaves the nav (or focus moves out) it springs back home.
 *
 * Progressive enhancement: if this never runs, the button keeps its normal
 * coral background and the links keep their normal hover. Desktop only.
 */
(() => {
	const DESKTOP = window.matchMedia("(min-width: 1024px)");
	const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");

	const nav = document.querySelector("#cs-navigation");
	if (!nav) return;

	const container = nav.querySelector(".cs-container");
	const button = nav.querySelector(".cs-nav-button");
	if (!container || !button) return;

	const links = Array.from(nav.querySelectorAll(".cs-ul .cs-li-link"));
	const targets = [...links, button];

	// Extra horizontal breathing room the pill adds around a link's text.
	const LINK_PAD = 18;

	let pill = null; // positioning shell (translate + size)
	let fill = null; // inner coral, scaled for the liquid squish
	let current = button; // element the pill currently sits on
	let live = false; // is the enhancement active (desktop)?

	function buildPill() {
		pill = document.createElement("span");
		pill.className = "cs-nav-pill";
		pill.setAttribute("aria-hidden", "true");
		fill = document.createElement("span");
		fill.className = "cs-nav-pill-fill";
		pill.appendChild(fill);
		container.appendChild(pill);
		container.classList.add("cs-pill-ready");
	}

	// Horizontal centre of an element, relative to the container.
	function centerX(el) {
		const c = container.getBoundingClientRect();
		const r = el.getBoundingClientRect();
		return r.left - c.left + r.width / 2;
	}

	// Water-droplet squish: stretch along travel (x), thin the middle (y),
	// overshoot to a fat rebound, then settle round. Scales with distance.
	function wobble(dist) {
		if (!fill || !fill.animate || REDUCED.matches) return;
		const t = Math.min(dist / 240, 1);
		const sx = 1.24 + t * 0.4; // up to ~1.64 stretch
		const sy = 0.84 - t * 0.22; // down to ~0.62 squish
		fill.animate(
			[
				{ transform: "scale(1, 1)" },
				{ transform: `scale(${sx}, ${sy})`, offset: 0.32 },
				{ transform: `scale(${1 - (sx - 1) * 0.45}, ${1 + (1 - sy) * 0.6})`, offset: 0.7 },
				{ transform: "scale(1, 1)" },
			],
			{ duration: 540, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
		);
	}

	function place(el, padX, animate) {
		if (!pill) return;
		const c = container.getBoundingClientRect();
		const r = el.getBoundingClientRect();
		const h = button.getBoundingClientRect().height;
		const w = r.width + padX * 2;
		const x = r.left - c.left - padX;
		const y = r.top - c.top + (r.height - h) / 2;

		if (!animate) pill.classList.add("cs-no-anim");
		pill.style.width = `${w}px`;
		pill.style.height = `${h}px`;
		pill.style.transform = `translate(${x}px, ${y}px)`;
		if (!animate) {
			void pill.offsetWidth; // flush, so the next move animates again
			pill.classList.remove("cs-no-anim");
		}
	}

	function moveTo(el, animate = true) {
		const dist = current ? Math.abs(centerX(el) - centerX(current)) : 0;
		current = el;
		const padX = el === button ? 0 : LINK_PAD;
		place(el, padX, animate);
		targets.forEach((t) => t.classList.toggle("cs-pill-active", t === el));
		if (animate && dist > 2) wobble(dist);
	}

	const home = (animate = true) => moveTo(button, animate);

	function onEnter(e) {
		moveTo(e.currentTarget);
	}
	function onLeave() {
		home();
	}
	function onFocusOut(e) {
		if (!nav.contains(e.relatedTarget)) home();
	}

	function bind() {
		targets.forEach((t) => {
			t.addEventListener("pointerenter", onEnter);
			t.addEventListener("focus", onEnter);
		});
		nav.addEventListener("pointerleave", onLeave);
		nav.addEventListener("focusout", onFocusOut);
	}

	function unbind() {
		targets.forEach((t) => {
			t.removeEventListener("pointerenter", onEnter);
			t.removeEventListener("focus", onEnter);
		});
		nav.removeEventListener("pointerleave", onLeave);
		nav.removeEventListener("focusout", onFocusOut);
	}

	function enable() {
		if (live) return;
		live = true;
		if (!pill) buildPill();
		bind();
		home(false); // settle on the button with no opening slide
	}

	function disable() {
		if (!live) return;
		live = false;
		unbind();
		container.classList.remove("cs-pill-ready");
		if (pill) {
			pill.remove();
			pill = null;
			fill = null;
		}
	}

	const sync = () => (DESKTOP.matches ? enable() : disable());

	// Keep the pill glued to its target through layout changes.
	let raf = 0;
	window.addEventListener("resize", () => {
		if (!live) return;
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(() => place(current, current === button ? 0 : LINK_PAD, false));
	});

	// Web font metrics change the resting width — re-settle once they load.
	if (document.fonts && document.fonts.ready) {
		document.fonts.ready.then(() => {
			if (live && current === button) home(false);
		});
	}

	DESKTOP.addEventListener("change", sync);
	sync();
})();
