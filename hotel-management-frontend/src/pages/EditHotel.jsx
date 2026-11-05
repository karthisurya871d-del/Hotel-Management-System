import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import HotelForm from "../components/HotelForm";
import { getHotelById, updateHotel } from "../api/hotels";

function EditHotel() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [submitError, setSubmitError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            try {
                const res = await getHotelById(id);
                if (isMounted) setHotel(res.data);
            } catch (err) {
                if (isMounted) setFetchError(err.message || "Hotel not found.");
            }
        };
        load();
        return () => { isMounted = false; };
    }, [id]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setSubmitError(null);
        try {
            await updateHotel(id, formData);
            navigate(`/hotels/${id}`, { state: { updated: true } });
        } catch (err) {
            const msg = Array.isArray(err?.errors)
                ? err.errors.join(" ")
                : err?.message || "Failed to update hotel.";
            setSubmitError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (fetchError) {
        return (
            <div className="page page-narrow">
                <div className="alert alert-error">{fetchError}</div>
                <Link to="/" className="btn btn-outline">← Back to Hotels</Link>
            </div>
        );
    }

    if (!hotel) {
        return (
            <div className="state-center">
                <div className="spinner" />
                <p>Loading hotel information…</p>
            </div>
        );
    }

    return (
        <div className="page page-narrow">
            <div className="form-header" style={{ marginBottom: "1.5rem" }}>
                <span className="badge-subtitle">Manage Listing</span>
                <h1 className="page-title">Edit Hotel Details</h1>
                <p style={{ color: "var(--color-muted)", fontSize: "0.95rem" }}>
                    Update details, pricing, location coordinates, or replace property imagery.
                </p>
            </div>
            <HotelForm
                initialData={hotel}
                onSubmit={handleSubmit}
                loading={loading}
                error={submitError}
                isEdit={true}
            />
        </div>
    );
}

export default EditHotel;
