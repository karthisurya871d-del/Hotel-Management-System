import { Link } from "react-router-dom";
import { IMAGE_BASE } from "../api/config";
const PLACEHOLDER = "https://placehold.co/600x400/e2e8f0/64748b?text=No+Image";
function HotelCard({ hotel, onDelete }) {
    const imgSrc = hotel.image ? `${IMAGE_BASE}${hotel.image}` : PLACEHOLDER;
    return (
        <article className="hotel-card">
            <div className="hotel-card-img-wrap">
                <img
                    src={imgSrc}
                    alt={hotel.title}
                    className="hotel-card-img"
                    onError={(e) => { e.target.src = PLACEHOLDER; }}
                />
                <div className="hotel-card-price-badge">
                    ${Number(hotel.price).toFixed(2)} <small>/night</small>
                </div>
            </div>
            <div className="hotel-card-body">
                <h3 className="hotel-card-title">{hotel.title}</h3>
                {(hotel.latitude && hotel.longitude) && (
                    <div className="hotel-card-location">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        {Number(hotel.latitude).toFixed(4)}, {Number(hotel.longitude).toFixed(4)}
                    </div>
                )}
                <p className="hotel-card-desc">
                    {hotel.description || "No description provided."}
                </p>
                <div className="hotel-card-actions">
                    <Link to={`/hotels/${hotel.id}`} className="btn btn-outline">View Details</Link>
                    <Link to={`/hotels/${hotel.id}/edit`} className="btn btn-secondary">Edit</Link>
                    <button className="btn btn-danger" onClick={() => onDelete(hotel)}>Delete</button>
                </div>
            </div>
        </article>
    );
}
export default HotelCard;
