import { useTheme } from "@/context/themeContextValue";

function Theme() {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "light" ? "Switch to dark theme" : "Switch to light theme";

  return (
    <button className="theme-toggle" type="button" aria-label={label} title={label} onClick={toggleTheme}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {theme === "light" ? (
          <path d="M20.8 14.4A9 9 0 0 1 9.6 3.2a9 9 0 1 0 11.2 11.2Z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="3.5" />
            <path d="M12 2.5v2m0 15v2M2.5 12h2m15 0h2M5.3 5.3l1.4 1.4m10.6 10.6 1.4 1.4m0-13.4-1.4 1.4M6.7 17.3l-1.4 1.4" />
          </>
        )}
      </svg>
    </button>
  );
}

export default Theme;
