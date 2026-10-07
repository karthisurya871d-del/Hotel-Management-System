const BASE_URL = "http://localhost:3000/api/hotels";

export async function getHotels(params = {}) {
    const query = new URLSearchParams();
    if (params.search)   query.set("search",   params.search);
    if (params.minPrice) query.set("minPrice",  params.minPrice);
    if (params.maxPrice) query.set("maxPrice",  params.maxPrice);
    if (params.page)     query.set("page",      params.page);
    if (params.limit)    query.set("limit",     params.limit);

    const res = await fetch(`${BASE_URL}?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch hotels.");
    return res.json();
}

export async function getHotelById(id) {
    const res = await fetch(`${BASE_URL}/${id}`);
    if (!res.ok) throw new Error("Hotel not found.");
    return res.json();
}

export async function createHotel(formData) {
    const res = await fetch(BASE_URL, {
        method: "POST",
        body: formData  // FormData — don't set Content-Type manually
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
}

export async function updateHotel(id, formData) {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        body: formData
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
}

export async function deleteHotel(id) {
    const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
}
