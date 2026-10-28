//
//	Page view counter. Sends ONE small message per page opened, to this site's
//	own address (/hq/v). Netlify passes it on, signed, to the counter behind it
//	(the [[redirects]] rule for /hq/v in netlify.toml).
//
//	The message holds three things and nothing else:
//	  path   the page's path, never its ?query or #part (they can hold form
//	         values or email addresses)
//	  from   the HOST of the page the visitor came from ("www.google.com"), or
//	         empty. Never the full address.
//	  nav    how the page was opened: navigate, reload or back_forward
//	No cookie, no identifier, nothing stored in the browser. The one exception is
//	`hq-skip`, below, which only exists in browsers that ask for it.
//
//	⚠ /privacy-policy/ describes exactly this. If this file changes what it sends
//	or stores, that page changes in the same commit.
//
//	The script tag in layouts/base.html carries data-hq-beacon: the daily health
//	check looks for it to confirm the counter is still on the page. The 404 page
//	sets data-path="/404" on it, so a missing page is counted as /404 rather
//	than as whatever address was asked for.
//

const LIVE_HOST = "www.shorelinewebdesign.com";
const SKIP_KEY = "hq-skip";
const ROBOT = /Lighthouse|HeadlessChrome|bot|crawl|spider/i;

//	?hq=off once stops this browser counting itself (Bryan's own devices);
//	?hq=on undoes it.
function skipped() {
	try {
		const flag = new URLSearchParams(location.search).get("hq");
		if (flag === "off") localStorage.setItem(SKIP_KEY, "1");
		if (flag === "on") localStorage.removeItem(SKIP_KEY);
		return localStorage.getItem(SKIP_KEY) === "1";
	} catch (e) {
		//	Storage blocked: nothing was saved, so nothing is skipped.
		return false;
	}
}

function cameFrom() {
	if (!document.referrer) return "";
	try {
		return new URL(document.referrer).hostname.toLowerCase();
	} catch (e) {
		return "";
	}
}

//	The browser's own word for how the page was opened. A prerendered page is
//	only sent once it is actually shown, and then it was a new navigation; older
//	Chrome calls it "prerender", which the counter would refuse.
function navType() {
	const entry = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
	const type = entry && entry.type;
	return type === "reload" || type === "back_forward" ? type : "navigate";
}

function send() {
	const tag = document.querySelector("script[data-hq-beacon]");
	const body = JSON.stringify({
		path: (tag && tag.dataset.path) || location.pathname,
		from: cameFrom(),
		nav: navType(),
	});
	if (navigator.sendBeacon) {
		navigator.sendBeacon("/hq/v", body);
	} else {
		fetch("/hq/v", { method: "POST", body, keepalive: true }).catch(() => {});
	}
}

function init() {
	if (skipped()) return;
	//	Deploy previews, branch deploys, localhost and local copies send nothing.
	if (location.hostname !== LIVE_HOST) return;
	//	PageSpeed's Lighthouse, this repo's own Playwright screenshots, crawlers.
	if (navigator.webdriver || ROBOT.test(navigator.userAgent)) return;

	if (document.prerendering) {
		//	Loaded ahead of a likely click: wait until it is shown, send nothing if
		//	it never is.
		document.addEventListener("prerenderingchange", send, { once: true });
	} else {
		send();
	}
	//	A page restored from the back/forward cache does not run scripts again,
	//	so it sends nothing, which is what the counter wants.
}

init();
