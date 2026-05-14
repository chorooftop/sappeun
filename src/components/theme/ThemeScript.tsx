import Script from 'next/script'
import { THEME_STORAGE_KEY } from './theme'

const themeScript = `
(function () {
  try {
    var theme = localStorage.getItem('${THEME_STORAGE_KEY}');
    var root = document.documentElement;
    var themeColor = theme === 'dark' ? '#0F1713' : theme === 'light' ? '#F4F8F5' : null;
    if (theme === 'light' || theme === 'dark') {
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
      document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) {
        meta.setAttribute('content', themeColor);
      });
    } else {
      root.removeAttribute('data-theme');
      root.style.removeProperty('color-scheme');
    }
  } catch (error) {}
})();
`

export function ThemeScript() {
  return (
    <Script
      id="sappeun-theme-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  )
}
