import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { getHotels, deleteHotel } from "../api/hotels";
import HotelCard from "../components/HotelCard";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/ConfirmModal";

function HotelList() {
    const location = useLocation();

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
    const [successMsg, setSuccessMsg] = useState(
        location.state?.added ? "Hotel added successfully!" :
        location.state?.deleted ? "Hotel deleted." : ""
    );

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

    useEffect(() => {
        if (successMsg) {
            const t = setTimeout(() => setSuccessMsg(""), 3000);
            return () => clearTimeout(t);
        }
    }, [successMsg]);

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

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await deleteHotel(deleteTarget.id);
            setSuccessMsg(`"${deleteTarget.title}" deleted successfully.`);
            setDeleteTarget(null);
            fetchHotels();
        } catch (err) {
            setError("Failed to delete hotel.");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <>
            {/* Hero */}
            <section className="hero">
                <div className="hero-overlay" />
                <div className="hero-content">
                    <h1 className="hero-title">Find Your Perfect Stay</h1>
                    <p className="hero-sub">Discover comfortable hotels and unforgettable experiences.</p>

                    <form className="hero-search" onSubmit={handleSearch}>
                        <input
                            type="text"
                            className="hero-input"
                            placeholder="Search hotel name…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <input
                            type="number"
                            className="hero-input hero-input-sm"
                            placeholder="Min price"
                            value={minPrice}
                            min="0"
                            onChange={(e) => setMinPrice(e.target.value)}
                        />
                        <input
                            type="number"
                            className="hero-input hero-input-sm"
                            placeholder="Max price"
                            value={maxPrice}
                            min="0"
                            onChange={(e) => setMaxPrice(e.target.value)}
                        />
                        <button type="submit" className="hero-search-btn">Search</button>
                    </form>
                </div>
            </section>

            {/* Listing */}
            <main className="main">
                <div className="listing-header">
                    <div>
                        <h2 className="listing-title">Explore Our Hotels</h2>
                        <p className="listing-count">{total} hotel{total !== 1 ? "s" : ""} found</p>
                    </div>
                    <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                        {(search || minPrice || maxPrice) && (
                            <button className="btn btn-outline btn-sm" onClick={handleClearFilters}>
                                Clear filters
                            </button>
                        )}
                        <Link to="/hotels/new" className="btn btn-primary">+ Add Hotel</Link>
                    </div>
                </div>

                {successMsg && <div className="alert alert-success">{successMsg}</div>}
                {error      && <div className="alert alert-error">{error}</div>}

                {loading ? (
                    <div className="state-center">
                        <div className="spinner" />
                        <p>Loading hotels…</p>
                    </div>
                ) : hotels.length === 0 ? (
                    <div className="state-center">
                        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
                            <path d="M3 21h18" /><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                            <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
                        </svg>
                        <p>No hotels found.</p>
                        {(search || minPrice || maxPrice) && (
                            <button className="btn btn-outline btn-sm" onClick={handleClearFilters}>
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="hotel-grid">
                        {hotels.map((hotel) => (
                            <HotelCard key={hotel.id} hotel={hotel} onDelete={setDeleteTarget} />
                        ))}
                    </div>
                )}

                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </main>

            {deleteTarget && (
                <ConfirmModal
                    message={`Delete "${deleteTarget.title}"? This cannot be undone.`}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </>
    );
}

export default HotelList;
