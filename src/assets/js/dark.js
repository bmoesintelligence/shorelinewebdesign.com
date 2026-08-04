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
		// On click, toggle the theme based on the current saved value
		localStorage.getItem("theme") === "light" ? enableDarkMode() : disableDarkMode();
	});
}
