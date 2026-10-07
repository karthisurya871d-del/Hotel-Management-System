import React from "react";
import { Link } from "react-router-dom";
function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <h2>STAYORA</h2>
                    <p>Discover comfortable hotels and unforgettable experiences.</p>
                </div>
                <div className="footer-links">
                    <div className="footer-col">
                        <h3>Explore</h3>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h3>Contact</h3>
                        <ul>
                            <li>Email: support@stayora.com</li>
                            <li>Phone: +1 (800) 123-4567</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} STAYORA. All rights reserved.</p>
            </div>
        </footer>
    );
}
export default Footer;
