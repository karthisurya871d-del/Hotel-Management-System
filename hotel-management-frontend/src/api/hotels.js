import { API_BASE_URL } from "./config";

const BASE_URL = API_BASE_URL;

export async function getHotels(params = {}) {
    const query = new URLSearchParams();
    if (params.search)   query.set("search",   params.search);
    if (params.location) query.set("location", params.location);
    if (params.minPrice) query.set("minPrice",  params.minPrice);
    if (params.maxPrice) query.set("maxPrice",  params.maxPrice);
    if (params.page)     query.set("page",      params.page);
    if (params.limit)    query.set("limit",     params.limit);

    const res = await fetch(`${BASE_URL}?${query.toString()}`);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch hotels.");
    }
    return data;
}

export async function getHotelById(id) {
    const res = await fetch(`${BASE_URL}/${id}`);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
        throw new Error(data?.message || "Hotel not found.");
    }
    return data;
}

export async function createHotel(formData) {
    const res = await fetch(BASE_URL, {
        method: "POST",
        body: formData
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
        throw data || new Error("Failed to create hotel.");
    }
    return data;
}

export async function updateHotel(id, formData) {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        body: formData
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
        throw data || new Error("Failed to update hotel.");
    }
    return data;
}

export async function deleteHotel(id) {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE"
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
        throw data || new Error("Failed to delete hotel.");
    }
    return data;
}
