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
            setError(err.errors ? err.errors.join(" ") : err.message || "Failed to create hotel.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="page page-narrow">
            <h1 className="page-title">Add New Hotel</h1>
            <HotelForm onSubmit={handleSubmit} loading={loading} error={error} isEdit={false} />
        </div>
    );
}
export default AddHotel;
