// Applies the saved theme and text size before first paint so the page does
// not flash the wrong colors. Loaded as a classic script in <head>.
(function () {
  try {
    var raw = localStorage.getItem('beforethethrone:v1');
    if (!raw) return;
    var s = (JSON.parse(raw) || {}).settings || {};
    var root = document.documentElement;
    if (s.theme === 'light' || s.theme === 'dark' || s.theme === 'auto') root.setAttribute('data-theme', s.theme);
    if (s.textSize === 'normal' || s.textSize === 'large' || s.textSize === 'larger') root.setAttribute('data-textsize', s.textSize);
  } catch (e) {
    /* storage blocked or unreadable; defaults apply */
  }
})();
