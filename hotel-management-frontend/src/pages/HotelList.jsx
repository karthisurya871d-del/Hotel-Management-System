import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { getHotels, deleteHotel } from "../api/hotels";
import HotelCard from "../components/HotelCard";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/ConfirmModal";

function HotelList() {
    const locationState = useLocation();
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [location, setLocation] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(9);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [_deleteLoading, setDeleteLoading] = useState(false);

    const [successMsg, setSuccessMsg] = useState(
        locationState.state?.added ? "Hotel added successfully!" :
        locationState.state?.deleted ? "Hotel deleted successfully." : ""
    );

    const fetchHotels = useCallback(async (targetPage = page) => {
        
        if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
            setError("Minimum price cannot exceed maximum price.");
            setHotels([]);
            setTotal(0);
            setTotalPages(0);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await getHotels({
                search: search.trim(),
                location: location.trim(),
                minPrice: minPrice !== "" ? minPrice : undefined,
                maxPrice: maxPrice !== "" ? maxPrice : undefined,
                page: targetPage,
                limit
            });
            setHotels(res.data || []);
            setTotalPages(res.totalPages || 0);
            setTotal(res.total || 0);
        } catch (err) {
            setError(err.message || "Failed to load hotels.");
            setHotels([]);
        } finally {
            setLoading(false);
        }
    }, [search, location, minPrice, maxPrice, page, limit]);

    useEffect(() => {
        fetchHotels(page);
    }, [page, limit, fetchHotels]);

    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(""), 4000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
            setError("Minimum price cannot exceed maximum price.");
            return;
        }
        setPage(1);
        fetchHotels(1);
    };

    const handleClearFilters = () => {
        setSearch("");
        setLocation("");
        setMinPrice("");
        setMaxPrice("");
        setError(null);
        setPage(1);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await deleteHotel(deleteTarget.id);
            setSuccessMsg(`"${deleteTarget.title}" was successfully deleted.`);
            setDeleteTarget(null);
            fetchHotels(page);
        } catch (err) {
            setError(err.message || "Failed to delete hotel.");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        window.scrollTo({ top: 380, behavior: "smooth" });
    };

    const hasActiveFilters = Boolean(search || location || minPrice || maxPrice);

    return (
        <>
            <section className="hero">
                <div className="hero-overlay" />
                <div className="hero-content">
                    <span className="hero-badge">Welcome to STAYORA</span>
                    <h1 className="hero-title">Discover Handcrafted Stays & Luxury Hotels</h1>
                    <p className="hero-sub">
                        Explore handpicked accommodations across the globe with transparent pricing and instant booking.
                    </p>

                    <form className="hero-search" onSubmit={handleSearchSubmit} role="search">
                        <div className="hero-input-group">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                className="hero-input"
                                placeholder="Hotel name or keyword…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                aria-label="Search hotel name"
                            />
                        </div>

                        <div className="hero-input-group">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            <input
                                type="text"
                                className="hero-input"
                                placeholder="Destination / City…"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                aria-label="Search destination"
                            />
                        </div>

                        <div className="hero-price-group">
                            <input
                                type="number"
                                className="hero-input hero-input-sm"
                                placeholder="Min ($)"
                                value={minPrice}
                                min="0"
                                onChange={(e) => setMinPrice(e.target.value)}
                                aria-label="Minimum price"
                            />
                            <span className="price-separator">–</span>
                            <input
                                type="number"
                                className="hero-input hero-input-sm"
                                placeholder="Max ($)"
                                value={maxPrice}
                                min="0"
                                onChange={(e) => setMaxPrice(e.target.value)}
                                aria-label="Maximum price"
                            />
                        </div>

                        <button type="submit" className="hero-search-btn">
                            Search Hotels
                        </button>
                    </form>
                </div>
            </section>

            <main className="main" id="hotels-section">
                <div className="listing-header">
                    <div>
                        <h2 className="listing-title">Available Accommodations</h2>
                        <p className="listing-count">
                            {total} {total === 1 ? "hotel" : "hotels"} found
                            {hasActiveFilters && " matching your criteria"}
                        </p>
                    </div>

                    <div className="listing-controls" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <div className="page-size-selector" style={{ fontSize: "0.9rem", color: "var(--color-muted)" }}>
                            <label htmlFor="limit-select" style={{ marginRight: "0.5rem" }}>Per page:</label>
                            <select
                                id="limit-select"
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPage(1);
                                }}
                                style={{
                                    padding: "0.3rem 0.5rem",
                                    borderRadius: "var(--radius)",
                                    border: "1px solid var(--color-border)",
                                    background: "var(--color-surface)"
                                }}
                            >
                                <option value={6}>6</option>
                                <option value={9}>9</option>
                                <option value={12}>12</option>
                                <option value={18}>18</option>
                            </select>
                        </div>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={handleClearFilters}
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                </div>

                {successMsg && <div className="alert alert-success">{successMsg}</div>}
                {error && <div className="alert alert-error">{error}</div>}

                {loading ? (
                    <div className="state-center">
                        <div className="spinner" />
                        <p>Loading STAYORA hotels…</p>
                    </div>
                ) : hotels.length === 0 ? (
                    <div className="state-center">
                        <svg
                            width="56"
                            height="56"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ opacity: 0.4, marginBottom: "1rem" }}
                            aria-hidden="true"
                        >
                            <path d="M3 21h18" />
                            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                            <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
                        </svg>
                        <h3>No hotels found</h3>
                        <p style={{ color: "var(--color-muted)", margin: "0.5rem 0 1.25rem" }}>
                            {hasActiveFilters
                                ? "We couldn't find any hotels matching your current search and filter settings."
                                : "No hotels are currently listed in the directory."}
                        </p>
                        {hasActiveFilters ? (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleClearFilters}
                            >
                                Reset Filters
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <div className="hotel-grid">
                        {hotels.map((hotel) => (
                            <HotelCard
                                key={hotel.id}
                                hotel={hotel}
                                onDelete={setDeleteTarget}
                            />
                        ))}
                    </div>
                )}

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </main>

            {deleteTarget && (
                <ConfirmModal
                    message={`Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone.`}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </>
    );
}

export default HotelList;
