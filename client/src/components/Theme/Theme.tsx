import { useTheme } from "@/context/themeContextValue";
import "./Theme.css";

function Theme() {
  const { theme, toggleTheme } = useTheme();

  return (
      <button className="theme-toggle" type="button" aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`} onClick={toggleTheme}>
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}

export default Theme;
