// Records how deep `window.history` was the moment this browser tab first
// loaded the app. A "Back" button can then check whether the user has
// navigated further since (history.length grew past that baseline) to tell
// a real in-app previous page apart from a fresh tab/direct link, where
// history.length is often already 2 (the tab's blank initial state plus the
// page it navigated to) even though there's nothing meaningful to go back
// to. Set via an inline script in the root layout so it runs before
// hydration — no risk of a click racing ahead of the baseline being stored.
export const NAV_HISTORY_BASELINE_KEY = "foto-history-baseline";

export const navHistoryBaselineScript = `if(!sessionStorage.getItem('${NAV_HISTORY_BASELINE_KEY}')){sessionStorage.setItem('${NAV_HISTORY_BASELINE_KEY}',String(window.history.length));}`;
