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
            <nav className="navbar">
                <div className="navbar-inner">
                    <Link to="/" className="navbar-brand">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21h18" />
                            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                            <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
                            <path d="M9 7h1" /><path d="M14 7h1" />
                            <path d="M9 11h1" /><path d="M14 11h1" />
                        </svg>
                        STAYORA
                    </Link>

                    <button
                        className="navbar-toggle"
                        onClick={() => setMenuOpen(o => !o)}
                        aria-label="Toggle menu"
                    >
                        <span /><span /><span />
                    </button>

                    <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
                        <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
                        <Link to="/hotels/new" className="navbar-cta" onClick={() => setMenuOpen(false)}>
                            + Add Hotel
                        </Link>
                    </div>
                </div>
            </nav>

            <Routes>
                <Route path="/"               element={<HotelList />} />
                <Route path="/hotels/new"     element={<AddHotel />} />
                <Route path="/hotels/:id"     element={<HotelDetail />} />
                <Route path="/hotels/:id/edit" element={<EditHotel />} />
                <Route path="*"              element={<div className="page"><h2 style={{padding:"4rem",textAlign:"center"}}>404 — Page not found</h2></div>} />
            </Routes>
            <Footer />
        </BrowserRouter>
    );
}

export default App;
