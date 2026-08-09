interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// TODO: implement styling — label-caps nav buttons, current page highlighted
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <nav aria-label="Pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button>
      <span aria-current="page">{page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
    </nav>
  );
}
