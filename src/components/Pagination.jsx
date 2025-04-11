import { useState, useEffect } from 'react';

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
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      {/* Page size selector and counter */}
      <div className="flex flex-col sm:flex-row items-center mb-4 sm:mb-0">
        <div className="flex items-center text-sm text-gray-700 mr-4">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="mx-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>items</span>
        </div>
        
        <div className="text-sm text-gray-700">
          {totalItems > 0 ? (
            <p>
              Showing <span className="font-medium">{startItem}</span> to{" "}
              <span className="font-medium">{endItem}</span> of{" "}
              <span className="font-medium">{totalItems}</span> results
            </p>
          ) : (
            <p>No results found</p>
          )}
        </div>
      </div>
      
      {/* Pagination buttons */}
      <div className="flex items-center space-x-1">
        {/* Previous page button */}
        <button
          onClick={() => handlePageChange(safePage - 1)}
          disabled={safePage === 1}
          className={`relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            safePage === 1
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
          }`}
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="sr-only">Previous</span>
        </button>
        
        {/* Page numbers */}
        {getPageNumbers().map((page, index) => (
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={`page-${page}`}
              onClick={() => handlePageChange(page)}
              className={`relative inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                page === safePage
                  ? "z-10 bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
              }`}
            >
              {page}
            </button>
          )
        ))}
        
        {/* Next page button */}
        <button
          onClick={() => handlePageChange(safePage + 1)}
          disabled={safePage === totalPages || totalPages === 0}
          className={`relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            safePage === totalPages || totalPages === 0
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
          }`}
        >
          <span className="sr-only">Next</span>
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Pagination;