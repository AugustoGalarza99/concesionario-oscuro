import React from "react";
import { Phone, Mail, MapPin, Instagram, Facebook } from "lucide-react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="home-footer" aria-label="Pie de página">
      <div className="footer-container">

        <div className="footer-brand">
          <h3>Dromux Automotores</h3>
          <p>Tu confianza, nuestro compromiso</p>
        </div>

        <div className="footer-section">
          <h4>Contacto</h4>
          <p><Phone size={16} /> +54 9 3572 674920</p>
          <p><Mail size={16} /> dromuxmotors@gmail.com</p>
          <p><MapPin size={16} /> Oncativo, Córdoba</p>
        </div>

        <div className="footer-section">
          <h4>Horarios</h4>
          <p>Lunes a Viernes: 9:00 – 19:00</p>
          <p>Sábados: 9:00 – 14:00</p>
        </div>

        <div className="footer-section">
          <h4>Seguinos</h4>
          <div className="footer-social">
            <a
              href="https://www.instagram.com/dromux.motors/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <Instagram size={22} />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61570872520576"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <Facebook size={22} />
            </a>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Dromux Automotores</p>
        <p>Desarrollado por Dromux</p>
      </div>
    </footer>
  );
}

export default Footer;
