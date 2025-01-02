import React from 'react';

interface PaginationProps {
  currentPage: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  hasMoreResults: boolean;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, onNextPage, onPrevPage, hasMoreResults }) => {
  return (
    <div className="mt-4 flex justify-between">
      <button
        onClick={onPrevPage}
        disabled={currentPage === 1}
        className={`px-4 py-2 border rounded-md ${
          currentPage === 1 ? 'bg-gray-200' : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        Zurück
      </button>
      <span>Seite {currentPage}</span>
      <button
        onClick={onNextPage}
        disabled={!hasMoreResults}
        className={`px-4 py-2 border rounded-md ${
          hasMoreResults ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-200'
        }`}
      >
        Weiter
      </button>
    </div>
  );
};

export default Pagination;
