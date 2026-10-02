import { Link } from "react-router-dom";

function HostRow({ ownerName, owner }) {
  const name = ownerName || owner?.name;
  if (!name) return null;

  const ownerId = owner?._id || (typeof owner === "string" ? owner : "");
  const ownerPath = owner?.slug || ownerId;

  const content = (
    <>
      <span className="pd-host-avatar" aria-hidden="true">{name.trim().charAt(0).toUpperCase()}</span>
      <span className="pd-host-copy">
        <strong>Hosted by {name}</strong>
      </span>
    </>
  );

  return ownerPath
    ? <Link className="pd-host-row" to={`/owners/${ownerPath}`}>{content}</Link>
    : <div className="pd-host-row">{content}</div>;
}

export default HostRow;
