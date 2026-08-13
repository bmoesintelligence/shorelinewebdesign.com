//
//    The Dark Mode System
//
//    Everyone lands on LIGHT unless they have clicked the toggle before. This
//    is a deliberate change from the CodeStitch kit, which defaulted to the OS
//    `prefers-color-scheme` setting: "Marine Layer" is the pitch, and under the
//    kit's rule every visitor on a dark OS (roughly half of them) never saw the
//    tan/navy palette or the daylight dioramas unless they went looking.
//
//    The toggle is untouched and a click is remembered forever.
//

const darkModeToggle = document.getElementById("dark-mode-toggle");

//
//    Theme crossfade
//
//    A class on <html> for the length of the switch, and only for that. It is
//    NOT applied inside enableDarkMode/disableDarkMode, because those also run
//    on every page load via detectColorScheme() - transitioning colours there
//    would make the saved theme visibly fade in on arrival.
//
//    Scoping it to the click is also what keeps the transition off everything
//    else: a permanent `transition: background-color` on * is the usual way
//    this is done and it makes every hover and focus feel sluggish forever.
//
const THEME_ANIM_MS = 300;
let themeAnimTimer;

function crossfadeTheme() {
	if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	const root = document.documentElement;
	root.classList.add("theme-anim");
	clearTimeout(themeAnimTimer);
	// a little longer than the CSS duration so nothing is cut mid-fade
	themeAnimTimer = setTimeout(() => root.classList.remove("theme-anim"), THEME_ANIM_MS + 60);
}

// Helper functions to toggle dark mode
function enableDarkMode() {
	document.body.classList.add("dark-mode");
	localStorage.setItem("theme", "dark");
	// Update aria-pressed state
	if (darkModeToggle) {
		darkModeToggle.setAttribute("aria-pressed", "true");
	}
}

function disableDarkMode() {
	document.body.classList.remove("dark-mode");
	localStorage.setItem("theme", "light");
	// Update aria-pressed state
	if (darkModeToggle) {
		// Defensive check: ensure button exists
		darkModeToggle.setAttribute("aria-pressed", "false");
	}
}

// Determines a user's dark mode preferences and applies theme
function detectColorScheme() {
	let theme = "light"; // Default to light theme

	// Check localStorage for a saved 'theme' preference. There is deliberately
	// no `prefers-color-scheme` fallback here - see the note at the top.
	if (localStorage.getItem("theme")) {
		theme = localStorage.getItem("theme");
	}

	// Apply the detected theme and set the initial aria-pressed state
	theme === "dark" ? enableDarkMode() : disableDarkMode();
}

// Run on page load to detect and apply the theme
detectColorScheme();

// Add event listener to the dark mode button toggle
if (darkModeToggle) {
	darkModeToggle.addEventListener("click", () => {
		// Arm the crossfade BEFORE the class flips, so the transition is already
		// in place when the colours change. Only here, never in detectColorScheme.
		crossfadeTheme();
		// On click, toggle the theme based on the current saved value
		localStorage.getItem("theme") === "light" ? enableDarkMode() : disableDarkMode();
	});
}
