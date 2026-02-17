import React from "react";
import { Phone, MessageSquare, Mail, MapPin, Clock, Instagram, Facebook } from "lucide-react";
import "./Contacto.css";
import Footer from "../Footer/Footer";


export default function Contacto() {
  return (
    <div className="c-contacto-page">
      {/* Hero simple */}
      <section className="c-contacto-hero">
        <div className="c-hero-content">
          <h1>Contacto Dromux Automotores</h1>
          <p>Estamos listos para ayudarte. ¡Escribinos o llamanos ahora!</p>
        </div>
      </section>

      {/* Información principal */}
      <section className="c-contacto-info">
        <div className="c-contacto-grid">
          {/* WhatsApp - el más destacado */}
          <a
            href="https://wa.me/5493572674920?text=Hola!%20Quiero%20consultar%20por%20un%20vehículo"
            target="_blank"
            rel="noopener noreferrer"
            className="c-contacto-card c-whatsapp"
          >
            <div className="c-card-icon">
              <MessageSquare size={48} />
            </div>
            <h3>WhatsApp</h3>
            <p className="c-contacto-value">+54 9 3572 674920</p>
            <p className="c-contacto-action">Chatear ahora</p>
          </a>

          {/* Teléfono */}
          <a href="tel:+549112345678" className="c-contacto-card">
            <div className="c-card-icon">
              <Phone size={48} />
            </div>
            <h3>Teléfono</h3>
            <p className="c-contacto-value">+54 9 3572 674920</p>
            <p className="c-contacto-action">Llamar</p>
          </a>

          {/* Email */}
          <a href="mailto:info@nexolab.com.ar" className="c-contacto-card">
            <div className="c-card-icon">
              <Mail size={48} />
            </div>
            <h3>Email</h3>
            <p className="c-contacto-value">dromuxmotors@gmail.com</p>
            <p className="c-contacto-action">Escribir</p>
          </a>

          {/* Dirección */}
          <div className="c-contacto-card">
            <div className="c-card-icon">
              <MapPin size={48} />
            </div>
            <h3>Dirección</h3>
            <p className="c-contacto-value">
              Oncativo<br />
              Cordoba
            </p>
          </div>

          {/* Horarios */}
          <div className="c-contacto-card">
            <div className="c-card-icon">
              <Clock size={48} />
            </div>
            <h3>Horarios de atención</h3>
            <p className="c-contacto-value">
              Lunes a Viernes: 9:00 - 19:00<br />
              Sábados: 9:00 - 14:00<br />
            </p>
          </div>
        </div>
      </section>

      {/* Mapa */}
      <section className="c-contacto-mapa">
        <h2>Nuestra ubicación</h2>
        <div className="c-mapa-container">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d581.6531962559169!2d-63.68240421330003!3d-31.913626116955026!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95cd23e6a3dce1f5%3A0x74be90c9116da3d5!2sPlaza%20General%20Paz!5e0!3m2!1ses!2sar!4v1767026062252!5m2!1ses!2sar" 
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Ubicación NexoLab Automotores"
          ></iframe>
        </div>
      </section>

      {/* Redes sociales */}
      <section className="c-contacto-redes">
        <h2>Seguinos en redes</h2>
        <div className="c-redes-grid">
          <a
            href="https://www.instagram.com/dromux.motors/"
            target="_blank"
            rel="noopener noreferrer"
            className="c-redes-card c-instagram"
          >
            <Instagram size={40} />
            <span>@dromux.motors</span>
          </a>

          <a
            href="https://www.facebook.com/profile.php?id=61570872520576"
            target="_blank"
            rel="noopener noreferrer"
            className="c-redes-card c-facebook"
          >
            <Facebook size={40} />
            <span>Dromux Motors</span>
          </a>
        </div>
      </section>
      <Footer/>
    </div>
  );
}