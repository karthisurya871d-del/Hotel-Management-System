import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getHotelById, deleteHotel } from "../api/hotels";
import ConfirmModal from "../components/ConfirmModal";

const IMAGE_BASE = "http://localhost:3000";
const PLACEHOLDER = "https://placehold.co/800x400/e2e8f0/94a3b8?text=No+Image";

const MAP_ZOOM = 14;

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
                <p>Loading hotel…</p>
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
                <Link to="/" className="btn btn-outline">← Back</Link>
            </div>

            <div className="detail-card">
                <img
                    src={imgSrc}
                    alt={hotel.title}
                    className="detail-img"
                    onError={(e) => { e.target.src = PLACEHOLDER; }}
                />

                <div className="detail-body">
                    <div className="detail-header">
                        <h1>{hotel.title}</h1>
                        <span className="detail-price">${Number(hotel.price).toFixed(2)} <small>/night</small></span>
                    </div>

                    {hotel.description && (
                        <p className="detail-desc">{hotel.description}</p>
                    )}

                    {hasLocation && (
                        <div className="detail-location">
                            <span>📍 Lat: {Number(hotel.latitude).toFixed(6)}, Lng: {Number(hotel.longitude).toFixed(6)}</span>
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
                        <Link to={`/hotels/${hotel.id}/edit`} className="btn btn-secondary">Edit</Link>
                        <button className="btn btn-danger" onClick={() => setShowConfirm(true)}>Delete</button>
                    </div>
                </div>

                {hasLocation && (
                    <div className="detail-map">
                        <iframe
                            title="Hotel location map"
                            src={buildMapUrl(Number(hotel.latitude), Number(hotel.longitude))}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                )}
            </div>

            {showConfirm && (
                <ConfirmModal
                    message={`Delete "${hotel.title}"? This cannot be undone.`}
                    onConfirm={handleDelete}
                    onCancel={() => setShowConfirm(false)}
                />
            )}
        </div>
    );
}

export default HotelDetail;
