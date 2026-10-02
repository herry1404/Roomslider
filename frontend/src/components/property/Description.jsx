import { useState } from "react";

function Description({ description }) {
  const [expanded, setExpanded] = useState(false);
  if (!description?.trim()) return null;
  const canExpand = description.length > 320;

  return (
    <section className="pd-section">
      <h2>Description</h2>
      <p className={`pd-description${expanded ? " pd-description--expanded" : ""}`}>{description}</p>
      {canExpand && (
        <button type="button" className="pd-text-action" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </section>
  );
}

export default Description;
