import { Link } from "react-router-dom";

const IMAGE_BASE = "http://localhost:3000";
const PLACEHOLDER = "https://placehold.co/400x220/e2e8f0/94a3b8?text=No+Image";

function HotelCard({ hotel, onDelete }) {
    const imgSrc = hotel.image ? `${IMAGE_BASE}${hotel.image}` : PLACEHOLDER;

    return (
        <div className="hotel-card">
            <img
                src={imgSrc}
                alt={hotel.title}
                className="hotel-card-img"
                onError={(e) => { e.target.src = PLACEHOLDER; }}
            />
            <div className="hotel-card-body">
                <h3 className="hotel-card-title">{hotel.title}</h3>
                <p className="hotel-card-desc">
                    {hotel.description
                        ? hotel.description.length > 100
                            ? hotel.description.slice(0, 100) + "…"
                            : hotel.description
                        : "No description provided."}
                </p>
                <div className="hotel-card-meta">
                    {(hotel.latitude && hotel.longitude) && (
                        <span className="hotel-card-location">
                            📍 {Number(hotel.latitude).toFixed(4)}, {Number(hotel.longitude).toFixed(4)}
                        </span>
                    )}
                    <span className="hotel-card-price">${Number(hotel.price).toFixed(2)}</span>
                </div>
                <div className="hotel-card-actions">
                    <Link to={`/hotels/${hotel.id}`} className="btn btn-outline">View</Link>
                    <Link to={`/hotels/${hotel.id}/edit`} className="btn btn-secondary">Edit</Link>
                    <button className="btn btn-danger" onClick={() => onDelete(hotel)}>Delete</button>
                </div>
            </div>
        </div>
    );
}

export default HotelCard;
