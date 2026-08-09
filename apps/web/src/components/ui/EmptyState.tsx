interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

// TODO: implement styling — centered, icon + title + description + optional CTA
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div role="status">
      <p>{title}</p>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
