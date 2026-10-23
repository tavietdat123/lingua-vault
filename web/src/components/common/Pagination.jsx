import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 12,
  pageSizeOptions = [12, 24, 48],
  onPageChange,
  onPageSizeChange,
  itemLabel = 'mục'
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems === 0) return null;

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  // Generate smart page numbers with ellipsis
  const getPageNumbers = () => {
    const delta = 1;
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  const handlePageSelect = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    if (onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <div className="pagination-wrapper">
      {/* Items count summary */}
      <div className="pagination-info">
        Hiển thị <span className="pagination-bold">{startIndex}</span> - <span className="pagination-bold">{endIndex}</span> trong tổng số <span className="pagination-bold">{totalItems}</span> {itemLabel}
      </div>

      <div className="pagination-controls">
        {/* Page size dropdown */}
        {onPageSizeChange && pageSizeOptions && pageSizeOptions.length > 0 && (
          <div className="pagination-size-selector">
            <span className="pagination-size-label">Mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                if (onPageSizeChange) onPageSizeChange(newSize);
                if (onPageChange) onPageChange(1);
              }}
              className="pagination-select"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="pagination-nav-group">
          {/* First page button */}
          <button
            type="button"
            onClick={() => handlePageSelect(1)}
            disabled={currentPage <= 1}
            className="pagination-btn pagination-nav-btn"
            title="Trang đầu"
            aria-label="Trang đầu"
          >
            <ChevronsLeft size={16} />
          </button>

          {/* Previous page button */}
          <button
            type="button"
            onClick={() => handlePageSelect(currentPage - 1)}
            disabled={currentPage <= 1}
            className="pagination-btn pagination-nav-btn"
            title="Trang trước"
            aria-label="Trang trước"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Page numbers */}
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="pagination-ellipsis">
                  ...
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePageSelect(p)}
                className={`pagination-btn pagination-page-btn ${isCurrent ? 'active' : ''}`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {p}
              </button>
            );
          })}

          {/* Next page button */}
          <button
            type="button"
            onClick={() => handlePageSelect(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="pagination-btn pagination-nav-btn"
            title="Trang tiếp"
            aria-label="Trang tiếp"
          >
            <ChevronRight size={16} />
          </button>

          {/* Last page button */}
          <button
            type="button"
            onClick={() => handlePageSelect(totalPages)}
            disabled={currentPage >= totalPages}
            className="pagination-btn pagination-nav-btn"
            title="Trang cuối"
            aria-label="Trang cuối"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
