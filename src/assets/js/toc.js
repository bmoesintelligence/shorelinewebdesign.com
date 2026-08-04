//
//    Contents rail for long-form pages (blog posts, the legal trio)
//
//    Builds the table of contents at runtime from the <h2>s inside .cs-prose,
//    rather than asking anyone to maintain one by hand. That matters because
//    posts are written in Decap, which emits plain markdown - there is nowhere
//    to declare a contents list even if we wanted one.
//
//    It removes itself when there are fewer than MIN_HEADINGS, so a short legal
//    page doesn't get a one-item table of contents.
//
//    Markup contract, produced by the page template:
//      <aside class="cs-rail"></aside>   (empty; this fills it)
//      ... .cs-prose containing the h2s
//    Styles live in longform.less.
//

const MIN_HEADINGS = 2;
// Matches the `top` on .cs-rail and the h2 scroll-margin-top in longform.less.
// Keep the three in step or a jumped-to heading lands under the nav.
const NAV_OFFSET = 110;

function slugify(text) {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
}

function buildToc() {
	const rail = document.querySelector(".cs-rail");
	const prose = document.querySelector(".cs-prose");
	if (!rail || !prose) return;

	const headings = Array.from(prose.querySelectorAll("h2"));
	if (headings.length < MIN_HEADINGS) return;

	// Every heading needs an id to be linkable. Authors don't write them, so
	// derive one, and de-duplicate - two sections legitimately share a name
	// ("What this means") often enough to matter, and duplicate ids would send
	// every one of those links to the first.
	const used = new Set();
	headings.forEach((h, i) => {
		if (!h.id) {
			let base = slugify(h.textContent) || `section-${i + 1}`;
			let id = base;
			let n = 2;
			while (used.has(id) || document.getElementById(id)) {
				id = `${base}-${n++}`;
			}
			h.id = id;
		}
		used.add(h.id);
	});

	// <details> so mobile gets a disclosure for free; longform.less forces it
	// open and neutralises the summary at desktop widths.
	const details = document.createElement("details");
	details.open = window.matchMedia("(min-width: 64rem)").matches;

	const box = document.createElement("div");
	box.className = "cs-toc-box";

	const summary = document.createElement("summary");
	summary.className = "cs-toc-summary";
	summary.textContent = "Contents";

	const list = document.createElement("ul");
	list.className = "cs-toc-list";

	const links = headings.map((h) => {
		const li = document.createElement("li");
		const a = document.createElement("a");
		a.className = "cs-toc-link";
		a.href = `#${h.id}`;
		a.textContent = h.textContent;
		li.appendChild(a);
		list.appendChild(li);
		return a;
	});

	details.appendChild(summary);
	details.appendChild(list);
	box.appendChild(details);
	rail.appendChild(box);

	// Only now does the rail become visible - CSS keeps it display:none until
	// this class lands, so a page with too few headings never flashes an empty
	// box before this script runs.
	rail.classList.add("cs-has-toc");

	// Tapping a link on mobile should collapse the disclosure again, or the
	// open list covers the section you just jumped to.
	if (!window.matchMedia("(min-width: 64rem)").matches) {
		links.forEach((a) =>
			a.addEventListener("click", () => {
				details.open = false;
			})
		);
	}

	setupScrollSpy(headings, links);
}

// Highlights whichever section the reader is currently in.
//
// Deliberately NOT "whichever heading is visible": with a long section the
// heading scrolls off and nothing would be highlighted. Instead track the LAST
// heading to have crossed the top of the viewport, which is the section you are
// actually reading.
function setupScrollSpy(headings, links) {
	if (!("IntersectionObserver" in window)) return;

	const seen = new Map();

	const setActive = () => {
		let activeIndex = -1;
		headings.forEach((h, i) => {
			// getBoundingClientRect is cheap here - this only runs on an
			// intersection change, not on every scroll event
			if (h.getBoundingClientRect().top <= NAV_OFFSET + 10) activeIndex = i;
		});

		// Above the first heading, highlight nothing rather than guessing
		links.forEach((a, i) => a.classList.toggle("cs-active", i === activeIndex));
	};

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((e) => seen.set(e.target, e.isIntersecting));
			setActive();
		},
		{
			// Top margin matches the nav offset so a heading counts as "reached"
			// exactly when it clears the nav
			rootMargin: `-${NAV_OFFSET}px 0px 0px 0px`,
			threshold: 0,
		}
	);

	headings.forEach((h) => observer.observe(h));
	setActive();
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", buildToc);
} else {
	buildToc();
}
