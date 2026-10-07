function Pagination({ page, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }
    return (
        <div className="pagination">
            <button
                className="btn btn-outline"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
            >
                ← Prev
            </button>
            {pages.map((p) => (
                <button
                    key={p}
                    className={`btn ${p === page ? "btn-primary" : "btn-outline"}`}
                    onClick={() => onPageChange(p)}
                >
                    {p}
                </button>
            ))}
            <button
                className="btn btn-outline"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
            >
                Next →
            </button>
        </div>
    );
}
export default Pagination;
