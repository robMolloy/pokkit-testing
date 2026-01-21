import { useState, useEffect } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
  PaginationNext,
} from "../ui/pagination";

export const Paginator = (
  p: {
    pageNumber?: number;
    setPageNumber?: (x: number) => void;
  } & ({ numberOfPages: number } | { numberOfItems: number; itemsPerPage: number }),
) => {
  const [pageNumber, setPageNumber] = useState(p.pageNumber ?? 0);

  const numberOfPages =
    "numberOfPages" in p ? p.numberOfPages : Math.ceil(p.numberOfItems / p.itemsPerPage);

  const allPageNumbers = [...Array(numberOfPages)].map((_, i) => i);
  const firstVisiblePageNumber = Math.max(0, pageNumber - 2);
  const lastVisiblePageNumber = Math.min(numberOfPages, pageNumber + 3);
  const visiblePageNumbers = allPageNumbers.slice(firstVisiblePageNumber, lastVisiblePageNumber);
  const lastPageNumber = Math.max(allPageNumbers.slice(-1)[0] ?? 0, 0);

  useEffect(() => {
    if (p.pageNumber) setPageNumber(p.pageNumber);
  }, [p.pageNumber]);
  useEffect(() => p.setPageNumber?.(pageNumber), [pageNumber]);
  useEffect(() => {
    if (pageNumber >= numberOfPages) setPageNumber(() => lastPageNumber);
  }, [numberOfPages]);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onClick={() => setPageNumber((x) => (x === 0 ? x : x - 1))} />
        </PaginationItem>
        {!visiblePageNumbers.includes(0) && pageNumber > 0 && (
          <PaginationItem>
            <PaginationLink onClick={() => setPageNumber(0)}>{1}</PaginationLink>
          </PaginationItem>
        )}
        {!visiblePageNumbers.includes(1) && pageNumber > 0 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {visiblePageNumbers.map((x) => (
          <PaginationItem key={x}>
            <PaginationLink onClick={() => setPageNumber(x)} isActive={pageNumber === x}>
              {x + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        {!visiblePageNumbers.includes(lastPageNumber - 1) && pageNumber < lastPageNumber && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {!visiblePageNumbers.includes(lastPageNumber) && (
          <PaginationItem>
            <PaginationLink onClick={() => setPageNumber(lastPageNumber)}>
              {lastPageNumber + 1}
            </PaginationLink>
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationNext
            onClick={() => setPageNumber((x) => (x === lastPageNumber ? x : x + 1))}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
