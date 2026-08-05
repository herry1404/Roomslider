import { useTheme } from "../context/ThemeContext";

function ThemeToggle() {
  const { dark, setDark } = useTheme();
  return (
    <button onClick={() => setDark(!dark)}>
      {dark ? "☀️ Light Mode" : "🌙 Dark Mode"}
    </button>
  );
}

export default ThemeToggle;
