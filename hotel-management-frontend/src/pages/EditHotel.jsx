import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
        const load = async () => {
            try {
                const res = await getHotelById(id);
                setHotel(res.data);
            } catch (err) {
                setFetchError(err.message || "Hotel not found.");
            }
        };
        load();
    }, [id]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setSubmitError(null);
        try {
            await updateHotel(id, formData);
            navigate(`/hotels/${id}`, { state: { updated: true } });
        } catch (err) {
            setSubmitError(err.errors ? err.errors.join(" ") : err.message || "Failed to update hotel.");
        } finally {
            setLoading(false);
        }
    };

    if (fetchError) {
        return (
            <div className="page page-narrow">
                <div className="alert alert-error">{fetchError}</div>
            </div>
        );
    }

    if (!hotel) {
        return (
            <div className="state-center">
                <div className="spinner" />
                <p>Loading hotel…</p>
            </div>
        );
    }

    return (
        <div className="page page-narrow">
            <h1 className="page-title">Edit Hotel</h1>
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
