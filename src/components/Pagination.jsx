import { useState, useEffect } from 'react';
import './Pagination.css';

const Pagination = ({ 
  totalItems, 
  currentPage = 1, 
  onPageChange, 
  pageSizeOptions = [8, 20, 50], 
  initialPageSize = 8
}) => {
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(1);
  
  useEffect(() => {
    setTotalPages(Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);
  
  // Ensure current page is within bounds
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  
  // Calculate display range
  const startItem = ((safePage - 1) * pageSize) + 1;
  const endItem = Math.min(startItem + pageSize - 1, totalItems);
  
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page, pageSize);
    }
  };
  
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    // Reset to first page when changing page size
    onPageChange(1, newSize);
  };
  
  // Generate page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are few pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      if (safePage > 3) {
        pageNumbers.push("...");
      }
      
      // Show pages around current page
      const startPage = Math.max(2, safePage - 1);
      const endPage = Math.min(totalPages - 1, safePage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (safePage < totalPages - 2) {
        pageNumbers.push("...");
      }
      
      // Always show last page if there's more than one page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  return (
    <div className="pagination-container">
      {/* Left: Results Counter */}
      <div className="pagination-results-counter">
        {totalItems > 0 ? (
          <p>
            Показано от <span className="font-medium">{startItem}</span> до{" "}
            <span className="font-medium">{endItem}</span> из{" "}
            <span className="font-medium">{totalItems}</span> результатов
          </p>
        ) : (
          <p>Результатов не найдено</p>
        )}
      </div>
      
      {/* Center: Page Size Selector */}
      <div className="pagination-size-selector">
        <span>Показано</span>
        <select
          value={pageSize}
          onChange={handlePageSizeChange}
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span>строк</span>
      </div>
      
      {/* Right: Pagination Buttons */}
      <div className="pagination-buttons">
        {/* Previous page button */}
        <button
          onClick={() => handlePageChange(safePage - 1)}
          disabled={safePage === 1}
          className={`pagination-button pagination-button-nav ${
            safePage === 1 ? "disabled" : ""
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="sr-only">Previous</span>
        </button>
        
        {/* Page numbers */}
        {getPageNumbers().map((page, index) => (
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis">
              ...
            </span>
          ) : (
            <button
              key={`page-${page}`}
              onClick={() => handlePageChange(page)}
              className={`pagination-button ${page === safePage ? "active" : ""}`}
            >
              {page}
            </button>
          )
        ))}
        
        {/* Next page button */}
        <button
          onClick={() => handlePageChange(safePage + 1)}
          disabled={safePage === totalPages || totalPages === 0}
          className={`pagination-button pagination-button-nav ${
            safePage === totalPages || totalPages === 0 ? "disabled" : ""
          }`}
        >
          <span className="sr-only">Next</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Pagination;