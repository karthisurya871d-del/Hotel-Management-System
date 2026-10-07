import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getHotels, deleteHotel } from "../api/hotels";
import HotelCard from "../components/HotelCard";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/ConfirmModal";

function HotelList() {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const fetchHotels = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getHotels({ search, minPrice, maxPrice, page, limit: 9 });
            setHotels(res.data);
            setTotalPages(res.totalPages);
            setTotal(res.total);
        } catch (err) {
            setError(err.message || "Failed to load hotels.");
        } finally {
            setLoading(false);
        }
    }, [search, minPrice, maxPrice, page]);

    useEffect(() => {
        fetchHotels();
    }, [fetchHotels]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchHotels();
    };

    const handleClearFilters = () => {
        setSearch("");
        setMinPrice("");
        setMaxPrice("");
        setPage(1);
    };

    const handleDeleteClick = (hotel) => {
        setDeleteTarget(hotel);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await deleteHotel(deleteTarget.id);
            setSuccessMsg(`"${deleteTarget.title}" deleted successfully.`);
            setDeleteTarget(null);
            fetchHotels();
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            setError("Failed to delete hotel.");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Hotels</h1>
                    <p className="page-subtitle">{total} hotel{total !== 1 ? "s" : ""} found</p>
                </div>
                <Link to="/hotels/new" className="btn btn-primary">+ Add Hotel</Link>
            </div>

            {/* Filters */}
            <form className="filters" onSubmit={handleSearch}>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search by title…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <input
                    type="number"
                    className="form-control filter-price"
                    placeholder="Min price"
                    value={minPrice}
                    min="0"
                    onChange={(e) => setMinPrice(e.target.value)}
                />
                <input
                    type="number"
                    className="form-control filter-price"
                    placeholder="Max price"
                    value={maxPrice}
                    min="0"
                    onChange={(e) => setMaxPrice(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">Search</button>
                {(search || minPrice || maxPrice) && (
                    <button type="button" className="btn btn-outline" onClick={handleClearFilters}>
                        Clear
                    </button>
                )}
            </form>

            {/* Messages */}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}
            {error      && <div className="alert alert-error">{error}</div>}

            {/* Content */}
            {loading ? (
                <div className="state-center">
                    <div className="spinner" />
                    <p>Loading hotels…</p>
                </div>
            ) : hotels.length === 0 ? (
                <div className="state-center">
                    <p className="empty-icon">🏨</p>
                    <p>No hotels found.</p>
                    {(search || minPrice || maxPrice) && (
                        <button className="btn btn-outline" onClick={handleClearFilters}>
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="hotel-grid">
                    {hotels.map((hotel) => (
                        <HotelCard key={hotel.id} hotel={hotel} onDelete={handleDeleteClick} />
                    ))}
                </div>
            )}

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

            {deleteTarget && (
                <ConfirmModal
                    message={`Delete "${deleteTarget.title}"? This cannot be undone.`}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
}

export default HotelList;
