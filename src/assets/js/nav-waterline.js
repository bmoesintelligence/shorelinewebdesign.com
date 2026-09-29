/**
 * Travelling waterline.
 *
 * A 2px coral rule that sits under whichever desktop nav link is hovered or
 * focused, sliding between them with a small spring and stretching through the
 * travel like a line drawn through water. At rest it parks under the current
 * page; on a page with no nav item of its own (the home page) it simply fades
 * out.
 *
 * ── why this replaced the travelling PILL, 2026-09-18 ──
 * The pill was a filled coral lozenge that lived BEHIND "Get started" and slid
 * out to whichever link you hovered. To make that work the script had to strip
 * the button's own coral background (the pill was standing in for it), which
 * meant the primary CTA turned into plain dark text the instant the pointer
 * touched any link in the bar. The one conversion element in the nav vanished
 * on hover, which is the opposite of what a travelling accent is for.
 *
 * A rule under the links cannot be mistaken for the button, so the button keeps
 * its fill permanently and this keeps the motion. It also gives the site its
 * first current-page indicator for free: the resting position is the active
 * link rather than the CTA.
 *
 * Progressive enhancement: if this never runs, the active link still reads as
 * active (weight + full ink, from .cs-active in root.less) and the links keep
 * their colour hover. Desktop only - below 1024px the nav is a collapsed panel
 * where a horizontal rule has nothing to travel along.
 */
(() => {
	const DESKTOP = window.matchMedia("(min-width: 1024px)");
	const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");

	const nav = document.querySelector("#cs-navigation");
	if (!nav) return;

	// ⚠ The rule is positioned against the BAR (.cs-container), not the list.
	//
	// It used to hang off .cs-ul, which was `position: relative` for exactly
	// that purpose. The services mega panel needs to span the whole bar, and an
	// absolutely positioned box is laid out against its nearest POSITIONED
	// ancestor - so .cs-ul had to go static and the rule had to move with it.
	//
	// Nothing else changed, because every number below comes out of
	// getBoundingClientRect and is expressed as a DIFFERENCE between two rects.
	// Swap which box `origin` is and the arithmetic follows it. The rule is
	// absolutely positioned, so being appended into a flex container does not
	// make it a flex item.
	const list = nav.querySelector(".cs-ul");
	if (!list) return;

	const origin = nav.querySelector(".cs-container") || list;

	// Direct children only. Dropdown links carry .cs-li-link too, and a
	// descendant selector would make them targets - the rule would dive into the
	// open panel and draw itself across the menu. The .cs-dropdown-toggle sits at
	// this depth, so "Services" still behaves like any other item.
	const links = Array.from(nav.querySelectorAll(".cs-ul > .cs-li > .cs-li-link"));
	if (!links.length) return;

	// Where the rule rests. header.html stamps .cs-active on the current page's
	// item at build time; null on a page with no item of its own, and the rule
	// then has no home to return to and hides instead.
	const homeLink = links.find((l) => l.classList.contains("cs-active")) || null;

	// Gap between a link's text box and the rule under it.
	const RULE_GAP = 7;

	let ruleEl = null; // positioning shell (translate + width)
	let fill = null; // the visible coral, scaled for the stretch
	let current = null; // element the rule currently sits under
	let live = false; // is the enhancement active (desktop)?

	function build() {
		ruleEl = document.createElement("span");
		ruleEl.className = "cs-nav-rule";
		ruleEl.setAttribute("aria-hidden", "true");
		fill = document.createElement("span");
		fill.className = "cs-nav-rule-fill";
		ruleEl.appendChild(fill);
		origin.appendChild(ruleEl);
	}

	// Horizontal centre of an element, relative to the positioning origin.
	function centerX(el) {
		const l = origin.getBoundingClientRect();
		const r = el.getBoundingClientRect();
		return r.left - l.left + r.width / 2;
	}

	// The stretch: elongate along the travel, thin through the middle, rebound
	// slightly short, settle. Same character as the pill's droplet squish, scaled
	// for a line rather than a lozenge - and scaled by distance, so a hop between
	// neighbours barely registers while a run across the bar reads.
	function stretch(dist) {
		if (!fill || !fill.animate || REDUCED.matches) return;
		const t = Math.min(dist / 260, 1);
		const sx = 1 + t * 0.5;
		const sy = 1 - t * 0.35;
		fill.animate(
			[
				{ transform: "scale(1, 1)" },
				{ transform: `scale(${sx}, ${sy})`, offset: 0.34 },
				{ transform: `scale(${1 - (sx - 1) * 0.28}, 1)`, offset: 0.72 },
				{ transform: "scale(1, 1)" },
			],
			{ duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
		);
	}

	function place(el, animate) {
		if (!ruleEl) return;
		const l = origin.getBoundingClientRect();
		const r = el.getBoundingClientRect();
		const x = r.left - l.left;
		const y = r.bottom - l.top + RULE_GAP;

		if (!animate) ruleEl.classList.add("cs-no-anim");
		ruleEl.style.width = `${r.width}px`;
		ruleEl.style.transform = `translate(${x}px, ${y}px)`;
		if (!animate) {
			void ruleEl.offsetWidth; // flush, so the next move animates again
			ruleEl.classList.remove("cs-no-anim");
		}
	}

	function moveTo(el, animate = true) {
		// Coming back from hidden there is nothing to travel FROM - the rule is
		// parked at 0,0 with no width - so it jumps into place and fades in
		// instead of sweeping in from the left edge of the list.
		const slide = animate && current !== null;
		const dist = current ? Math.abs(centerX(el) - centerX(current)) : 0;
		current = el;
		place(el, slide);
		ruleEl.classList.add("cs-rule-on");
		if (slide && dist > 2) stretch(dist);
	}

	function hide() {
		if (!ruleEl) return;
		ruleEl.classList.remove("cs-rule-on");
		current = null;
	}

	// Back to the current page's item, or out of sight if this page has none.
	function home(animate = true) {
		if (homeLink) moveTo(homeLink, animate);
		else hide();
	}

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
		links.forEach((t) => {
			t.addEventListener("pointerenter", onEnter);
			t.addEventListener("focus", onEnter);
		});
		nav.addEventListener("pointerleave", onLeave);
		nav.addEventListener("focusout", onFocusOut);
	}

	function unbind() {
		links.forEach((t) => {
			t.removeEventListener("pointerenter", onEnter);
			t.removeEventListener("focus", onEnter);
		});
		nav.removeEventListener("pointerleave", onLeave);
		nav.removeEventListener("focusout", onFocusOut);
	}

	function enable() {
		if (live) return;
		live = true;
		if (!ruleEl) build();
		bind();
		home(false); // settle with no opening slide
	}

	function disable() {
		if (!live) return;
		live = false;
		unbind();
		if (ruleEl) {
			ruleEl.remove();
			ruleEl = null;
			fill = null;
		}
		current = null;
	}

	const sync = () => (DESKTOP.matches ? enable() : disable());

	// Keep the rule glued to its target through layout changes.
	let raf = 0;
	window.addEventListener("resize", () => {
		if (!live || !current) return;
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(() => place(current, false));
	});

	// Web font metrics change every link's width - re-settle once they load.
	if (document.fonts && document.fonts.ready) {
		document.fonts.ready.then(() => {
			if (live && current && current === homeLink) place(current, false);
		});
	}

	DESKTOP.addEventListener("change", sync);
	sync();
})();
