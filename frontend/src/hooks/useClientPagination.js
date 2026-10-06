import { useMemo, useState } from "react";

export default function useClientPagination(items, { limit = 10 } = {}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / limit) || 1;
  const currentPage = Math.min(page, totalPages);

  const rows = useMemo(
    () => items.slice((currentPage - 1) * limit, currentPage * limit),
    [currentPage, items, limit],
  );

  return {
    page: currentPage,
    rows,
    setPage,
    totalPages,
  };
}

