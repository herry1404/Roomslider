import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className = "",
}) {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <span className="empty-state-icon"><Icon size={24} /></span>
      {title && <h2>{title}</h2>}
      {description && <p>{description}</p>}
      {actionLabel && (actionHref
        ? <a className="empty-state-action" href={actionHref}>{actionLabel}</a>
        : <button className="empty-state-action" type="button" onClick={onAction}>{actionLabel}</button>)}
    </div>
  );
}
