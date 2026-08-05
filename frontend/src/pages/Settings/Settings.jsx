import ThemeToggle from "../../components/ThemeToggle";

function Settings() {
  return (
    <div className="container" style={{ padding: "48px 0", maxWidth: "600px" }}>
      <h1 style={{ marginBottom: "24px" }}>Settings</h1>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p style={{ fontWeight: 600, marginBottom: "4px" }}>Appearance</p>
          <p style={{ fontSize: "14px", color: "var(--color-text-light)" }}>
            Switch between light and dark mode
          </p>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}

export default Settings;
