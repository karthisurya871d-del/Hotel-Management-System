import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IMAGE_BASE } from "../api/config";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;
const MAX_FILE_SIZE = 5 * 1024 * 1024; 

function HotelForm({ initialData, onSubmit, loading, error, isEdit }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: initialData?.title || "",
        location: initialData?.location || "",
        description: initialData?.description || "",
        latitude: initialData?.latitude != null ? String(initialData.latitude) : "",
        longitude: initialData?.longitude != null ? String(initialData.longitude) : "",
        price: initialData?.price != null ? String(initialData.price) : ""
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(
        initialData?.image ? `${IMAGE_BASE}${initialData.image}` : null
    );
    const [validationErrors, setValidationErrors] = useState([]);

    useEffect(() => {
        if (initialData) {
            setForm({
                title: initialData.title || "",
                location: initialData.location || "",
                description: initialData.description || "",
                latitude: initialData.latitude != null ? String(initialData.latitude) : "",
                longitude: initialData.longitude != null ? String(initialData.longitude) : "",
                price: initialData.price != null ? String(initialData.price) : ""
            });
            if (initialData.image) {
                setImagePreview(`${IMAGE_BASE}${initialData.image}`);
            }
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setImageFile(null);
            if (!isEdit) setImagePreview(null);
            return;
        }

        const errors = [];
        if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.test(file.name)) {
            errors.push("Only JPG, JPEG, PNG, and WEBP image formats are supported.");
        }
        if (file.size > MAX_FILE_SIZE) {
            errors.push("Image file size exceeds the 5MB limit.");
        }

        if (errors.length > 0) {
            setValidationErrors(errors);
            e.target.value = "";
            return;
        }

        setValidationErrors([]);
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const parseCoordinate = (coordStr) => {
        if (!coordStr) return "";
        const str = String(coordStr).trim();
        if (!isNaN(str) && str !== "") return str;

        const match = str.match(/([+-]?\d+\.?\d*)\s*°?\s*([NSEW])?/i);
        if (match) {
            let num = parseFloat(match[1]);
            const dir = match[2] ? match[2].toUpperCase() : "";
            if (dir === "S" || dir === "W") num = -num;
            return String(num);
        }
        return str;
    };

    const validate = (parsedLat, parsedLng) => {
        const errs = [];

        if (!form.title.trim()) {
            errs.push("Title is required.");
        } else if (form.title.trim().length > 150) {
            errs.push("Title cannot exceed 150 characters.");
        }

        if (!form.location.trim()) {
            errs.push("Location is required.");
        } else if (form.location.trim().length > 255) {
            errs.push("Location cannot exceed 255 characters.");
        }

        if (!form.price || String(form.price).trim() === "") {
            errs.push("Price is required.");
        } else if (isNaN(form.price) || Number(form.price) <= 0) {
            errs.push("Price must be a positive number.");
        }

        if (parsedLat !== "") {
            if (isNaN(parsedLat)) {
                errs.push("Latitude must be a valid number.");
            } else {
                const lat = Number(parsedLat);
                if (lat < -90 || lat > 90) {
                    errs.push("Latitude must be between -90 and 90.");
                }
            }
        }

        if (parsedLng !== "") {
            if (isNaN(parsedLng)) {
                errs.push("Longitude must be a valid number.");
            } else {
                const lng = Number(parsedLng);
                if (lng < -180 || lng > 180) {
                    errs.push("Longitude must be between -180 and 180.");
                }
            }
        }

        if (!isEdit && !imageFile) {
            errs.push("Hotel image is required.");
        }

        if (imageFile) {
            if (!ALLOWED_TYPES.includes(imageFile.type) && !ALLOWED_EXTENSIONS.test(imageFile.name)) {
                errs.push("Only JPG, JPEG, PNG, and WEBP image formats are supported.");
            }
            if (imageFile.size > MAX_FILE_SIZE) {
                errs.push("Image file size exceeds the 5MB limit.");
            }
        }

        return errs;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const parsedLat = parseCoordinate(form.latitude);
        const parsedLng = parseCoordinate(form.longitude);

        const errs = validate(parsedLat, parsedLng);
        if (errs.length > 0) {
            setValidationErrors(errs);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        setValidationErrors([]);
        const formData = new FormData();
        formData.append("title", form.title.trim());
        formData.append("location", form.location.trim());
        formData.append("description", form.description.trim());
        formData.append("latitude", parsedLat);
        formData.append("longitude", parsedLng);
        formData.append("price", form.price);
        if (imageFile) {
            formData.append("image", imageFile);
        }

        onSubmit(formData);
    };

    return (
        <form className="hotel-form" onSubmit={handleSubmit} noValidate>
            {validationErrors.length > 0 && (
                <div className="alert alert-error">
                    <ul>
                        {validationErrors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    {typeof error === "string" ? error : error.message || "Something went wrong."}
                </div>
            )}

            <div className="form-group">
                <label htmlFor="title">
                    Hotel Name / Title <span className="required">*</span>
                </label>
                <input
                    id="title"
                    name="title"
                    type="text"
                    className="form-control"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Grand Palace Hotel & Spa"
                    maxLength={150}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="location">
                    Location / City <span className="required">*</span>
                </label>
                <input
                    id="location"
                    name="location"
                    type="text"
                    className="form-control"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Paris, France or New York, USA"
                    maxLength={255}
                    required
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
                    placeholder="Describe the hotel amenities, ambience, view, and unique features..."
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
                        placeholder="e.g. 48.8566 (-90 to 90)"
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
                        placeholder="e.g. 2.3522 (-180 to 180)"
                    />
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="price">
                    Price per night (USD) <span className="required">*</span>
                </label>
                <input
                    id="price"
                    name="price"
                    type="number"
                    className="form-control"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="e.g. 199.99"
                    min="0.01"
                    step="0.01"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="image">
                    Hotel Image {isEdit ? "(Optional — keep blank to preserve existing image)" : <span className="required">*</span>}
                </label>
                <input
                    id="image"
                    name="image"
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                />
                <small style={{ color: "var(--color-muted)", display: "block", marginTop: "4px" }}>
                    Accepted formats: JPG, JPEG, PNG, WEBP. Maximum size: 5 MB.
                </small>

                {imagePreview && (
                    <div className="image-preview" style={{ marginTop: "1rem" }}>
                        <img
                            src={imagePreview}
                            alt="Preview"
                            style={{ maxHeight: "220px", borderRadius: "8px", objectFit: "cover" }}
                        />
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
