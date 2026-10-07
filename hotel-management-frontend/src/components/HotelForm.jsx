import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const IMAGE_BASE = "http://localhost:3000";

function HotelForm({ initialData, onSubmit, loading, error, isEdit }) {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: "",
        description: "",
        latitude: "",
        longitude: "",
        price: ""
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);

    useEffect(() => {
        if (initialData) {
            setForm({
                title:       initialData.title       || "",
                description: initialData.description || "",
                latitude:    initialData.latitude    != null ? String(initialData.latitude)  : "",
                longitude:   initialData.longitude   != null ? String(initialData.longitude) : "",
                price:       initialData.price       != null ? String(initialData.price)     : ""
            });
            if (initialData.image) {
                setImagePreview(`${IMAGE_BASE}${initialData.image}`);
            }
        }
    }, [initialData]);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const parseCoordinate = (coordStr) => {
        if (!coordStr) return "";
        let str = String(coordStr).trim();
        if (!isNaN(str) && str !== "") return str;
        
        // Match numbers optionally followed by degree symbol and N/S/E/W
        const match = str.match(/([+-]?\d+\.?\d*)\s*°?\s*([NSEW])?/i);
        if (match) {
            let num = parseFloat(match[1]);
            const dir = match[2] ? match[2].toUpperCase() : '';
            if (dir === 'S' || dir === 'W') num = -num;
            return String(num);
        }
        return str;
    };

    const validate = (parsedLat, parsedLng) => {
        const errs = [];
        if (!form.title.trim()) errs.push("Title is required.");
        if (!form.price) {
            errs.push("Price is required.");
        } else if (isNaN(form.price) || Number(form.price) <= 0) {
            errs.push("Price must be a positive number.");
        }
        if (parsedLat && isNaN(parsedLat)) errs.push("Latitude must be a valid number.");
        if (parsedLng && isNaN(parsedLng)) errs.push("Longitude must be a valid number.");
        return errs;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const parsedLat = parseCoordinate(form.latitude);
        const parsedLng = parseCoordinate(form.longitude);

        const errs = validate(parsedLat, parsedLng);
        if (errs.length > 0) {
            setValidationErrors(errs);
            return;
        }
        setValidationErrors([]);

        const formData = new FormData();
        formData.append("title",       form.title.trim());
        formData.append("description", form.description);
        formData.append("latitude",    parsedLat);
        formData.append("longitude",   parsedLng);
        formData.append("price",       form.price);
        if (imageFile) formData.append("image", imageFile);

        onSubmit(formData);
    };

    return (
        <form className="hotel-form" onSubmit={handleSubmit} noValidate>
            {validationErrors.length > 0 && (
                <div className="alert alert-error">
                    <ul>
                        {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    {typeof error === "string" ? error : error.message || "Something went wrong."}
                </div>
            )}

            <div className="form-group">
                <label htmlFor="title">Title <span className="required">*</span></label>
                <input
                    id="title"
                    name="title"
                    type="text"
                    className="form-control"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Hotel name"
                    maxLength={150}
                />
            </div>

            <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    name="description"
                    className="form-control"
                    rows={4}
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe the hotel..."
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="latitude">Latitude</label>
                    <input
                        id="latitude"
                        name="latitude"
                        type="text"
                        className="form-control"
                        value={form.latitude}
                        onChange={handleChange}
                        placeholder="e.g. 28.6139"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="longitude">Longitude</label>
                    <input
                        id="longitude"
                        name="longitude"
                        type="text"
                        className="form-control"
                        value={form.longitude}
                        onChange={handleChange}
                        placeholder="e.g. 77.2090"
                    />
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="price">Price per night (USD) <span className="required">*</span></label>
                <input
                    id="price"
                    name="price"
                    type="number"
                    className="form-control"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                />
            </div>

            <div className="form-group">
                <label htmlFor="image">Hotel Image</label>
                <input
                    id="image"
                    name="image"
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                />
                {imagePreview && (
                    <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                    </div>
                )}
            </div>

            <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving…" : isEdit ? "Update Hotel" : "Add Hotel"}
                </button>
            </div>
        </form>
    );
}

export default HotelForm;
