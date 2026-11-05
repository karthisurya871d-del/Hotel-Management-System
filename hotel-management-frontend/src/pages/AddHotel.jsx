import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HotelForm from "../components/HotelForm";
import { createHotel } from "../api/hotels";

function AddHotel() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError(null);
        try {
            await createHotel(formData);
            navigate("/", { state: { added: true } });
        } catch (err) {
            const msg = Array.isArray(err?.errors)
                ? err.errors.join(" ")
                : err?.message || "Failed to create hotel.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page page-narrow">
            <div className="form-header" style={{ marginBottom: "1.5rem" }}>
                <span className="badge-subtitle">New Listing</span>
                <h1 className="page-title">Add New Hotel</h1>
                <p style={{ color: "var(--color-muted)", fontSize: "0.95rem" }}>
                    Publish a new accommodation on STAYORA with detailed property information and imagery.
                </p>
            </div>
            <HotelForm
                onSubmit={handleSubmit}
                loading={loading}
                error={error}
                isEdit={false}
            />
        </div>
    );
}

export default AddHotel;
