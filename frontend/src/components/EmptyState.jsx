export default function EmptyState({ title = "Nothing here yet", message = "Create your first item to get started." }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
