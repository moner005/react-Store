import { useTheme } from "@/context/ThemeContext";
import "./Theme.css";

function Theme() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}

export default Theme;