import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import HotelList from "./pages/HotelList";
import HotelDetail from "./pages/HotelDetail";
import AddHotel from "./pages/AddHotel";
import EditHotel from "./pages/EditHotel";

function App() {
    return (
        <BrowserRouter>
            <header className="header">
                <div className="header-inner">
                    <Link to="/" className="header-logo">🏨 Hotel Manager</Link>
                    <nav className="header-nav">
                        <Link to="/">All Hotels</Link>
                        <Link to="/hotels/new" className="btn btn-primary btn-sm">+ Add Hotel</Link>
                    </nav>
                </div>
            </header>

            <main className="main">
                <Routes>
                    <Route path="/"                  element={<HotelList />} />
                    <Route path="/hotels/new"         element={<AddHotel />} />
                    <Route path="/hotels/:id"         element={<HotelDetail />} />
                    <Route path="/hotels/:id/edit"    element={<EditHotel />} />
                    <Route path="*"                   element={<div className="page"><h2>404 — Page not found</h2></div>} />
                </Routes>
            </main>
        </BrowserRouter>
    );
}

export default App;
