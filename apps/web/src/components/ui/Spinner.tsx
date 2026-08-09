// TODO: implement styling — circular spinner using secondary-container color
export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return <span role="status" aria-label={label} />;
}
