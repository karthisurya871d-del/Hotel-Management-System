import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom";
import { useState } from "react";
import HotelList from "./pages/HotelList";
import HotelDetail from "./pages/HotelDetail";
import AddHotel from "./pages/AddHotel";
import EditHotel from "./pages/EditHotel";
import Footer from "./components/Footer";

function App() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <BrowserRouter>
            <nav className="navbar" aria-label="Main Navigation">
                <div className="navbar-inner">
                    <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M3 21h18" />
                            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                            <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
                            <path d="M9 7h1" /><path d="M14 7h1" />
                            <path d="M9 11h1" /><path d="M14 11h1" />
                        </svg>
                        <span>STAYORA</span>
                    </Link>

                    <button
                        className="navbar-toggle"
                        onClick={() => setMenuOpen(o => !o)}
                        aria-label="Toggle navigation menu"
                        aria-expanded={menuOpen}
                    >
                        <span /><span /><span />
                    </button>

                    <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
                        <NavLink to="/" end onClick={() => setMenuOpen(false)}>
                            Explore Stays
                        </NavLink>
                        <Link to="/hotels/new" className="navbar-cta" onClick={() => setMenuOpen(false)}>
                            + Add Hotel
                        </Link>
                    </div>
                </div>
            </nav>

            <Routes>
                <Route path="/" element={<HotelList />} />
                <Route path="/hotels/new" element={<AddHotel />} />
                <Route path="/hotels/:id" element={<HotelDetail />} />
                <Route path="/hotels/:id/edit" element={<EditHotel />} />
                <Route
                    path="*"
                    element={
                        <div className="page" style={{ textAlign: "center", padding: "6rem 1.5rem" }}>
                            <h2>404 — Page Not Found</h2>
                            <p style={{ color: "var(--color-muted)", margin: "1rem 0 2rem" }}>
                                The page you are looking for does not exist or has moved.
                            </p>
                            <Link to="/" className="btn btn-primary">Return to Homepage</Link>
                        </div>
                    }
                />
            </Routes>

            <Footer />
        </BrowserRouter>
    );
}

export default App;
