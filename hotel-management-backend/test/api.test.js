require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const app = require("../src/app");
const pool = require("../src/config/db");

let passed = 0;
let failed = 0;
const results = [];

function logOutput(msg) {
    console.log(msg);
}

async function test(name, fn) {
    try {
        await fn();
        passed++;
        results.push({ name, status: "PASSED" });
        logOutput(`  ✓ ${name}`);
    } catch (err) {
        failed++;
        results.push({ name, status: "FAILED", error: err.message });
        logOutput(`  ✗ ${name}`);
        logOutput(`    ${err.message}`);
    }
}

function createSmallJpegBuffer() {
    
    return Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
        0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
        0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
        0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
        0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
        0x00, 0x7f, 0x00, 0xff, 0xd9
    ]);
}

async function runTests() {
    console.log("\n=======================================================");
    console.log("   STAYORA PHASE 1 — AUTOMATED BACKEND INTEGRATION TESTS");
    console.log("=======================================================\n");

    const initialRecords = await pool.query("SELECT * FROM hotels ORDER BY id ASC;");
    console.log(`Preserved existing database records before tests: ${initialRecords.rowCount} row(s).`);
    const initialIds = initialRecords.rows.map(r => r.id);

    const server = http.createServer((req, res) => {
        res.setHeader("Connection", "close");
        app(req, res);
    });
    server.keepAliveTimeout = 0;
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}/api/hotels`;
    console.log(`Ephemeral test server running at ${baseUrl}\n`);

    let testHotelId = null;
    let createdImageRelativePath = null;

    try {
        
        await test("GET /api/hotels — Fetch hotels list successfully", async () => {
            const res = await fetch(baseUrl);
            assert.strictEqual(res.status, 200);
            const json = await res.json();
            assert.strictEqual(json.success, true);
            assert.ok(Array.isArray(json.data));
            assert.strictEqual(typeof json.total, "number");
        });

        await test("POST /api/hotels — Fail when image is missing", async () => {
            const form = new FormData();
            form.append("title", "Hotel Without Image");
            form.append("location", "Test City");
            form.append("price", "150");

            const res = await fetch(baseUrl, { method: "POST", body: form, headers: { Connection: "close" } });
            assert.strictEqual(res.status, 400);
            const json = await res.json();
            assert.strictEqual(json.success, false);
            assert.ok(json.errors.some(e => e.toLowerCase().includes("image")));
        });

        await test("POST /api/hotels — Fail when title is missing", async () => {
            const form = new FormData();
            form.append("location", "Test City");
            form.append("price", "150");
            form.append("image", new Blob([createSmallJpegBuffer()], { type: "image/jpeg" }), "hotel.jpg");

            const res = await fetch(baseUrl, { method: "POST", body: form, headers: { Connection: "close" } });
            assert.strictEqual(res.status, 400);
            const json = await res.json();
            assert.strictEqual(json.success, false);
            assert.ok(json.errors.some(e => e.toLowerCase().includes("title")));
        });

        await test("POST /api/hotels — Fail when price is negative or zero", async () => {
            const form = new FormData();
            form.append("title", "Negative Price Hotel");
            form.append("location", "Test City");
            form.append("price", "-20.00");
            form.append("image", new Blob([createSmallJpegBuffer()], { type: "image/jpeg" }), "hotel.jpg");

            const res = await fetch(baseUrl, { method: "POST", body: form, headers: { Connection: "close" } });
            assert.strictEqual(res.status, 400);
            const json = await res.json();
            assert.strictEqual(json.success, false);
            assert.ok(json.errors.some(e => e.toLowerCase().includes("price")));
        });

        await test("POST /api/hotels — Fail when latitude exceeds 90 or longitude exceeds 180", async () => {
            const form = new FormData();
            form.append("title", "Invalid Coords Hotel");
            form.append("location", "Test City");
            form.append("price", "120");
            form.append("latitude", "95.5"); 
            form.append("longitude", "-190.0"); 
            form.append("image", new Blob([createSmallJpegBuffer()], { type: "image/jpeg" }), "hotel.jpg");

            const res = await fetch(baseUrl, { method: "POST", body: form, headers: { Connection: "close" } });
            assert.strictEqual(res.status, 400);
            const json = await res.json();
            assert.strictEqual(json.success, false);
            assert.ok(json.errors.some(e => e.toLowerCase().includes("latitude")));
            assert.ok(json.errors.some(e => e.toLowerCase().includes("longitude")));
        });

        await test("POST /api/hotels — Fail when image is unsupported format (.txt)", async () => {
            const form = new FormData();
            form.append("title", "Bad Format Hotel");
            form.append("location", "Test City");
            form.append("price", "120");
            form.append("image", new Blob(["not an image"], { type: "text/plain" }), "test.txt");

            const res = await fetch(baseUrl, { method: "POST", body: form, headers: { Connection: "close" } });
            assert.strictEqual(res.status, 400);
            const json = await res.json();
            assert.strictEqual(json.success, false);
            assert.ok(json.message.includes("allowed") || json.errors.some(e => e.includes("allowed")));
        });

        await test("POST /api/hotels — Successfully create hotel with location, coordinates and image", async () => {
            const form = new FormData();
            form.append("title", "STAYORA Grand Azure Resort");
            form.append("location", "Nice, French Riviera");
            form.append("description", "A breathtaking Mediterranean seaside luxury escape.");
            form.append("latitude", "43.7102");
            form.append("longitude", "7.2620");
            form.append("price", "349.50");
            form.append("image", new Blob([createSmallJpegBuffer()], { type: "image/jpeg" }), "azure.jpg");

            const res = await fetch(baseUrl, { method: "POST", body: form, headers: { Connection: "close" } });
            assert.strictEqual(res.status, 201);
            const json = await res.json();
            assert.strictEqual(json.success, true);
            assert.ok(json.data.id);
            assert.strictEqual(json.data.title, "STAYORA Grand Azure Resort");
            assert.strictEqual(json.data.location, "Nice, French Riviera");
            assert.strictEqual(Number(json.data.price), 349.50);
            assert.ok(json.data.image.startsWith("/uploads/"));

            testHotelId = json.data.id;
            createdImageRelativePath = json.data.image;

            const uploadedDiskPath = path.join(__dirname, "../src", createdImageRelativePath.replace(/^\//, ""));
            assert.ok(fs.existsSync(uploadedDiskPath), "Uploaded image should exist on disk");
        });

        await test("GET /api/hotels/:id — Fetch hotel details by valid ID", async () => {
            const res = await fetch(`${baseUrl}/${testHotelId}`);
            assert.strictEqual(res.status, 200);
            const json = await res.json();
            assert.strictEqual(json.success, true);
            assert.strictEqual(json.data.id, testHotelId);
            assert.strictEqual(json.data.location, "Nice, French Riviera");
            assert.strictEqual(Number(json.data.latitude), 43.7102);
            assert.strictEqual(Number(json.data.longitude), 7.2620);
        });

        await test("GET /api/hotels/:id — Return 404 for nonexistent hotel ID", async () => {
            const res = await fetch(`${baseUrl}/99999999`);
            assert.strictEqual(res.status, 404);
            const json = await res.json();
            assert.strictEqual(json.success, false);
        });

        await test("GET /api/hotels/:id — Return 400 for invalid ID format (e.g. abc, -5)", async () => {
            const res1 = await fetch(`${baseUrl}/abc`, { headers: { Connection: "close" } });
            assert.strictEqual(res1.status, 400);
            await res1.text();

            const res2 = await fetch(`${baseUrl}/-10`, { headers: { Connection: "close" } });
            assert.strictEqual(res2.status, 400);
            await res2.text();
        });

        await test("PUT /api/hotels/:id — Update hotel details preserving existing image", async () => {
            const form = new FormData();
            form.append("title", "STAYORA Grand Azure Resort & Spa");
            form.append("location", "Cannes, French Riviera");
            form.append("price", "399.00");

            const res = await fetch(`${baseUrl}/${testHotelId}`, { method: "PUT", body: form, headers: { Connection: "close" } });
            assert.strictEqual(res.status, 200);
            const json = await res.json();
            assert.strictEqual(json.success, true);
            assert.strictEqual(json.data.title, "STAYORA Grand Azure Resort & Spa");
            assert.strictEqual(json.data.location, "Cannes, French Riviera");
            assert.strictEqual(Number(json.data.price), 399.00);
            assert.strictEqual(json.data.image, createdImageRelativePath, "Original image should remain preserved");

            const uploadedDiskPath = path.join(__dirname, "../src", createdImageRelativePath.replace(/^\//, ""));
            assert.ok(fs.existsSync(uploadedDiskPath), "Preserved image file must exist on disk");
        });

        await test("PUT /api/hotels/:id — Update hotel replacing image and safely removing old image", async () => {
            const oldImagePath = path.join(__dirname, "../src", createdImageRelativePath.replace(/^\//, ""));
            assert.ok(fs.existsSync(oldImagePath), "Old image should exist before update");

            const form = new FormData();
            form.append("title", "STAYORA Azure Palace");
            form.append("location", "Monaco");
            form.append("price", "550.00");
            form.append("image", new Blob([createSmallJpegBuffer()], { type: "image/jpeg" }), "new_azure.jpg");

            const res = await fetch(`${baseUrl}/${testHotelId}`, { method: "PUT", body: form, headers: { Connection: "close" } });
            assert.strictEqual(res.status, 200);
            const json = await res.json();
            assert.strictEqual(json.success, true);
            assert.strictEqual(json.data.location, "Monaco");
            assert.notStrictEqual(json.data.image, createdImageRelativePath);

            createdImageRelativePath = json.data.image;

            const newImagePath = path.join(__dirname, "../src", json.data.image.replace(/^\//, ""));
            assert.ok(fs.existsSync(newImagePath), "New image must exist on disk");
            for (let i = 0; i < 15; i++) {
                if (!fs.existsSync(oldImagePath)) break;
                await new Promise((r) => setTimeout(r, 80));
            }
            assert.ok(!fs.existsSync(oldImagePath), "Old image should be cleanly removed after update");
        });

        await test("PUT /api/hotels/:id — Return 404 when updating nonexistent hotel", async () => {
            const form = new FormData();
            form.append("title", "Ghost Hotel");
            form.append("price", "200");

            const res = await fetch(`${baseUrl}/99999999`, { method: "PUT", body: form, headers: { Connection: "close" } });
            assert.strictEqual(res.status, 404);
            await res.text();
        });

        await test("GET /api/hotels?search=azure — Case-insensitive title search", async () => {
            const res = await fetch(`${baseUrl}?search=aZuRe`);
            assert.strictEqual(res.status, 200);
            const json = await res.json();
            assert.strictEqual(json.success, true);
            assert.ok(json.data.some(h => h.id === testHotelId));
        });

        await test("GET /api/hotels?location=monaco — Case-insensitive location filter", async () => {
            const res = await fetch(`${baseUrl}?location=mOnAcO`);
            assert.strictEqual(res.status, 200);
            const json = await res.json();
            assert.strictEqual(json.success, true);
            assert.ok(json.data.some(h => h.id === testHotelId));
        });

        await test("GET /api/hotels?minPrice=500 — Filter by minimum price", async () => {
            const res = await fetch(`${baseUrl}?minPrice=500`);
            assert.strictEqual(res.status, 200);
            const json = await res.json();
            assert.strictEqual(json.success, true);
            assert.ok(json.data.every(h => Number(h.price) >= 500));
        });

        await test("GET /api/hotels?maxPrice=600 — Filter by maximum price", async () => {
            const res = await fetch(`${baseUrl}?maxPrice=600`);
            assert.strictEqual(res.status, 200);
            const json = await res.json();
            assert.strictEqual(json.success, true);
            assert.ok(json.data.every(h => Number(h.price) <= 600));
        });

        await test("GET /api/hotels?minPrice=700&maxPrice=300 — Return 400 when minPrice > maxPrice", async () => {
            const res = await fetch(`${baseUrl}?minPrice=700&maxPrice=300`);
            assert.strictEqual(res.status, 400);
            const json = await res.json();
            assert.strictEqual(json.success, false);
            assert.ok(json.message.includes("minPrice cannot be greater than maxPrice"));
        });

        await test("GET /api/hotels — Combined filters return correct matching hotel", async () => {
            const res = await fetch(`${baseUrl}?search=azure&location=monaco&minPrice=500&maxPrice=600`);
            assert.strictEqual(res.status, 200);
            const json = await res.json();
            assert.strictEqual(json.success, true);
            assert.ok(json.data.some(h => h.id === testHotelId));
        });

        await test("GET /api/hotels?page=999&limit=5 — Accurate pagination handling for empty page", async () => {
            const res = await fetch(`${baseUrl}?page=999&limit=5`);
            assert.strictEqual(res.status, 200);
            const json = await res.json();
            assert.strictEqual(json.success, true);
            assert.strictEqual(json.page, 999);
            assert.strictEqual(json.limit, 5);
            assert.strictEqual(json.count, 0);
            assert.deepStrictEqual(json.data, []);
            assert.ok(json.total >= 1);
        });

        await test("DELETE /api/hotels/:id — Delete hotel and clean up image file from disk", async () => {
            const imageDiskPath = path.join(__dirname, "../src", createdImageRelativePath.replace(/^\//, ""));
            assert.ok(fs.existsSync(imageDiskPath), "Image must exist prior to deletion");

            const res = await fetch(`${baseUrl}/${testHotelId}`, { method: "DELETE", headers: { Connection: "close" } });
            assert.strictEqual(res.status, 200);
            const json = await res.json();
            assert.strictEqual(json.success, true);
            assert.strictEqual(json.data.id, testHotelId);

            for (let i = 0; i < 30; i++) {
                if (!fs.existsSync(imageDiskPath)) break;
                await new Promise((r) => setTimeout(r, 100));
            }
            assert.ok(!fs.existsSync(imageDiskPath), "Image file should be cleanly deleted from disk");

            const checkDb = await pool.query("SELECT * FROM hotels WHERE id = $1;", [testHotelId]);
            assert.strictEqual(checkDb.rowCount, 0);
        });

        await test("DELETE /api/hotels/:id — Return 404 when deleting nonexistent hotel", async () => {
            const res = await fetch(`${baseUrl}/99999999`, { method: "DELETE" });
            assert.strictEqual(res.status, 404);
            const json = await res.json();
            assert.strictEqual(json.success, false);
        });

        await test("GET /api/hotels?search=nonexistent_xyz — Correct handling when no hotels match", async () => {
            const res = await fetch(`${baseUrl}?search=nonexistent_xyz_hotel_string_12345`);
            assert.strictEqual(res.status, 200);
            const json = await res.json();
            assert.strictEqual(json.success, true);
            assert.strictEqual(json.total, 0);
            assert.strictEqual(json.count, 0);
            assert.deepStrictEqual(json.data, []);
        });

        await test("POST /api/hotels — Fail when title or location exceeds max character lengths", async () => {
            const form = new FormData();
            form.append("title", "A".repeat(151)); 
            form.append("location", "B".repeat(256)); 
            form.append("price", "100");
            form.append("image", new Blob([createSmallJpegBuffer()], { type: "image/jpeg" }), "test.jpg");

            const res = await fetch(baseUrl, { method: "POST", body: form, headers: { Connection: "close" } });
            assert.strictEqual(res.status, 400);
            const json = await res.json();
            assert.strictEqual(json.success, false);
            assert.ok(json.errors.some(e => e.includes("150 characters")));
            assert.ok(json.errors.some(e => e.includes("255 characters")));
        });

        await test("PUT /api/hotels/:id — Fail when updated coordinates are invalid", async () => {
            const check = await pool.query("SELECT id FROM hotels ORDER BY id ASC LIMIT 1;");
            if (check.rowCount > 0) {
                const sampleId = check.rows[0].id;
                const form = new FormData();
                form.append("latitude", "999"); 

                const res = await fetch(`${baseUrl}/${sampleId}`, { method: "PUT", body: form, headers: { Connection: "close" } });
                assert.strictEqual(res.status, 400);
                const json = await res.json();
                assert.strictEqual(json.success, false);
                assert.ok(json.errors.some(e => e.includes("latitude")));
            }
        });

        await test("POST /api/hotels — Fail when image exceeds 5MB limit", async () => {
            const oversizeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024);
            const form = new FormData();
            form.append("title", "Oversized Image Hotel");
            form.append("location", "Test City");
            form.append("price", "120");
            form.append("image", new Blob([oversizeBuffer], { type: "image/jpeg" }), "oversized.jpg");

            let res;
            try {
                res = await fetch(baseUrl, { method: "POST", body: form, headers: { Connection: "close" } });
            } catch (netErr) {
                assert.ok(netErr.message.includes("fetch failed") || netErr.message.includes("reset"));
                return;
            }
            assert.strictEqual(res.status, 400);
            const json = await res.json();
            assert.strictEqual(json.success, false);
            assert.ok(json.message.toLowerCase().includes("5mb") || json.errors?.some(e => e.toLowerCase().includes("5mb")));
        });

        await test("Database Integrity — Verify initial existing records remain 100% intact", async () => {
            const finalRecords = await pool.query("SELECT * FROM hotels ORDER BY id ASC;");
            for (const id of initialIds) {
                const found = finalRecords.rows.some(r => r.id === id);
                assert.ok(found, `Initial record ID ${id} must remain intact in database`);
            }
        });

    } finally {
        if (server.closeAllConnections) {
            server.closeAllConnections();
        }
        await new Promise((resolve) => server.close(resolve));
        await pool.end();
    }

    logOutput("\n=======================================================");
    logOutput(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
    logOutput("=======================================================\n");

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
