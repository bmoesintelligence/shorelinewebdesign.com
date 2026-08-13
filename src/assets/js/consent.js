//
//	Cookie consent + Google Analytics loader.
//
//	NOTHING analytics-related happens until someone presses Accept. gtag is not
//	in the HTML at all: this file injects it, and only after a stored "granted".
//	That is the difference between a consent banner and a consent-shaped
//	decoration, and it is also why PageSpeed still scores what it scored before
//	analytics existed - Lighthouse never clicks Accept, so gtag never loads
//	during an audit and the ~90KB and its main-thread time never appear.
//
//	Contract with _includes/components/consent.html - change both together:
//	  #cs-consent, [data-consent="accept"], [data-consent="decline"]
//
//	The measurement ID arrives on the element as data-ga4 rather than being
//	written into this file, so _data/client.js stays the single switch. No ID,
//	no banner in the markup, and this file no-ops.
//

const CONSENT_KEY = "analytics-consent";
const banner = document.getElementById("cs-consent");

//	Load gtag. Guarded so a double-accept, or an accept on a page where the
//	stored value already ran this, can't inject the script twice.
let loaded = false;

function loadAnalytics(id) {
	if (loaded || !id) return;
	loaded = true;

	//	The standard GA4 snippet, built in JS rather than pasted into the <head>.
	//	Deferred to an idle moment: consent usually happens during reading, and
	//	there is no reason for a metrics script to compete with the page.
	const start = () => {
		const s = document.createElement("script");
		s.async = true;
		s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
		document.head.appendChild(s);

		window.dataLayer = window.dataLayer || [];
		function gtag() {
			window.dataLayer.push(arguments);
		}
		window.gtag = gtag;
		gtag("js", new Date());
		//	anonymize_ip is redundant on GA4 (it always truncates) but harmless,
		//	and it documents the intent for anyone reading this later.
		gtag("config", id, { anonymize_ip: true });
	};

	if ("requestIdleCallback" in window) {
		requestIdleCallback(start, { timeout: 2000 });
	} else {
		setTimeout(start, 1);
	}
}

function hideBanner() {
	if (!banner) return;
	banner.hidden = true;
	document.body.classList.remove("consent-open");
}

function remember(value) {
	try {
		localStorage.setItem(CONSENT_KEY, value);
	} catch (e) {
		//	Private browsing with storage blocked. Fail closed: the choice isn't
		//	remembered, so the banner returns next visit, and analytics stays off
		//	unless they accept again. Never fail open on a consent decision.
	}
}

function init() {
	if (!banner) return;

	const id = banner.dataset.ga4;
	let stored = null;
	try {
		stored = localStorage.getItem(CONSENT_KEY);
	} catch (e) {
		stored = null;
	}

	if (stored === "granted") {
		loadAnalytics(id);
		return; //	banner stays hidden
	}
	if (stored === "denied") {
		return; //	respect it; don't ask again
	}

	//	No decision yet. Reveal the banner. It is position: fixed, so this cannot
	//	shift layout - see the note in root.less about keeping CLS at 0.
	banner.hidden = false;
	document.body.classList.add("consent-open");

	banner.addEventListener("click", (e) => {
		const btn = e.target.closest("[data-consent]");
		if (!btn) return;

		if (btn.dataset.consent === "accept") {
			remember("granted");
			loadAnalytics(id);
		} else {
			remember("denied");
		}
		hideBanner();
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init);
} else {
	init();
}
