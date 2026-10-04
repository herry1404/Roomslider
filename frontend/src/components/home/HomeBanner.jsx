import { optimizeCloudinaryImage } from "../../utils/optimizeCloudinaryImage";
import { Link } from "react-router-dom";

function HomeBanner({ section }) {
  const c = section?.config || {};
  if (!c.imageUrl && !c.text) return null;

  const hasButton = c.buttonText && c.linkUrl;
  const btnStyle = {
    display: "inline-block",
    marginTop: "10px",
    padding: "8px 16px",
    borderRadius: "999px",
    background: "var(--color-primary)",
    color: "#fff",
    fontWeight: 600,
    fontSize: "13px",
    textDecoration: "none",
  };

  return (
    <section className="latest-rooms">
      <div className="container">
        <div
          style={{
            borderRadius: "16px",
            overflow: "hidden",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
          }}
        >
          {c.imageUrl && (
            <img
              src={optimizeCloudinaryImage(c.imageUrl, 960)}
              alt={section.title || "Offer"}
              loading="lazy"
              style={{
                width: "100%",
                display: "block",
                maxHeight: "260px",
                objectFit: "cover",
              }}
            />
          )}
          {(c.text || hasButton) && (
            <div style={{ padding: "14px 16px" }}>
              {c.text && (
                <p style={{ margin: 0, color: "var(--color-text)" }}>{c.text}</p>
              )}
              {hasButton &&
                (c.linkUrl.startsWith("/") ? (
                  <Link to={c.linkUrl} style={btnStyle}>
                    {c.buttonText}
                  </Link>
                ) : (
                  <a
                    href={c.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={btnStyle}
                  >
                    {c.buttonText}
                  </a>
                ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default HomeBanner;
