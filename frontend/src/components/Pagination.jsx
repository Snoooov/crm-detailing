const Pagination = ({ total, perPage, currentPage, onPageChange }) => {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const getVisiblePages = () => {
    if (totalPages <= 7) return pages;
    if (currentPage <= 4) return [...pages.slice(0, 5), '...', totalPages];
    if (currentPage >= totalPages - 3) return [1, '...', ...pages.slice(totalPages - 5)];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
      paddingTop: 16,
      borderTop: '1px solid #e5e7eb',
    }}>
      <div style={{ fontSize: 13, color: '#6b7280' }}>
        Strona {currentPage} z {totalPages} ({total} rekordów)
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '6px 10px',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            background: 'white',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            color: currentPage === 1 ? '#d1d5db' : '#374151',
            fontSize: 13,
          }}
        >
          ←
        </button>

        {getVisiblePages().map((page, i) => (
          page === '...' ? (
            <span key={`dots-${i}`} style={{
              padding: '6px 10px',
              color: '#6b7280',
              fontSize: 13,
            }}>
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              style={{
                padding: '6px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                background: currentPage === page ? '#2563eb' : 'white',
                color: currentPage === page ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: currentPage === page ? 600 : 400,
                minWidth: 32,
              }}
            >
              {page}
            </button>
          )
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '6px 10px',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            background: 'white',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            color: currentPage === totalPages ? '#d1d5db' : '#374151',
            fontSize: 13,
          }}
        >
          →
        </button>
      </div>
    </div>
  );
};

export default Pagination;