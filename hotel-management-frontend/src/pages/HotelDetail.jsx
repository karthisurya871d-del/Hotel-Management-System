import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getHotelById, deleteHotel } from "../api/hotels";
import ConfirmModal from "../components/ConfirmModal";
import { IMAGE_BASE } from "../api/config";
const PLACEHOLDER = "https://placehold.co/1200x600/e2e8f0/64748b?text=No+Image";
function buildMapUrl(lat, lng) {
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
}
function HotelDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    useEffect(() => {
        const load = async () => {
            try {
                const res = await getHotelById(id);
                setHotel(res.data);
            } catch (err) {
                setError(err.message || "Hotel not found.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);
    const handleDelete = async () => {
        try {
            await deleteHotel(id);
            navigate("/", { state: { deleted: true } });
        } catch (err) {
            setError("Failed to delete hotel.");
            setShowConfirm(false);
        }
    };
    if (loading) {
        return (
            <div className="state-center">
                <div className="spinner" />
                <p>Loading hotel details…</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className="page">
                <div className="alert alert-error">{error}</div>
                <Link to="/" className="btn btn-outline">← Back to list</Link>
            </div>
        );
    }
    const imgSrc = hotel.image ? `${IMAGE_BASE}${hotel.image}` : PLACEHOLDER;
    const hasLocation = hotel.latitude && hotel.longitude;
    return (
        <div className="page">
            <div className="detail-back">
                <Link to="/" className="btn btn-outline">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Hotels
                </Link>
            </div>
            <div className="detail-card">
                <div className="detail-hero">
                    <img
                        src={imgSrc}
                        alt={hotel.title}
                        className="detail-img"
                        onError={(e) => { e.target.src = PLACEHOLDER; }}
                    />
                    <div className="detail-price-tag">
                        <span className="amount">${Number(hotel.price).toFixed(2)}</span>
                        <span className="label">per night</span>
                    </div>
                </div>
                <div className="detail-body">
                    <div className="detail-header">
                        <h1>{hotel.title}</h1>
                        {hasLocation && (
                            <div className="detail-location">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                Latitude: {Number(hotel.latitude).toFixed(6)}, Longitude: {Number(hotel.longitude).toFixed(6)}
                            </div>
                        )}
                    </div>
                    {hotel.description ? (
                        <p className="detail-desc">{hotel.description}</p>
                    ) : (
                        <p className="detail-desc" style={{ fontStyle: 'italic', color: 'var(--color-muted)' }}>
                            No description available for this hotel.
                        </p>
                    )}
                    {hasLocation && (
                        <div className="detail-map-section">
                            <h3>Location Map</h3>
                            <div className="detail-map">
                                <iframe
                                    title="Hotel location map"
                                    src={buildMapUrl(Number(hotel.latitude), Number(hotel.longitude))}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                            <a
                                href={`https://www.google.com/maps?q=${hotel.latitude},${hotel.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="map-link"
                            >
                                Open in Google Maps ↗
                            </a>
                        </div>
                    )}
                    <div className="detail-actions">
                        <Link to={`/hotels/${hotel.id}/edit`} className="btn btn-secondary">Edit Hotel</Link>
                        <button className="btn btn-danger" onClick={() => setShowConfirm(true)}>Delete Hotel</button>
                    </div>
                </div>
            </div>
            {showConfirm && (
                <ConfirmModal
                    message={`Are you sure you want to delete "${hotel.title}"? This action cannot be undone.`}
                    onConfirm={handleDelete}
                    onCancel={() => setShowConfirm(false)}
                />
            )}
        </div>
    );
}
export default HotelDetail;
