import { Link } from "react-router-dom";

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <h2>STAYORA</h2>
                    <p>
                        Discover comfortable hotels, luxury boutique resorts, and unforgettable travel experiences across the globe.
                    </p>
                </div>
                <div className="footer-links">
                    <div className="footer-col">
                        <h3>Quick Links</h3>
                        <ul>
                            <li><Link to="/">Explore Stays</Link></li>
                            <li><Link to="/hotels/new">List Your Hotel</Link></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h3>Contact & Support</h3>
                        <ul>
                            <li>Email: support@stayora.com</li>
                            <li>Phone: +1 (800) 555-STAY</li>
                            <li>Location: San Francisco, CA</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; 2026 STAYORA. All rights reserved. Professional Hotel Platform Phase 1.</p>
            </div>
        </footer>
    );
}

export default Footer;
