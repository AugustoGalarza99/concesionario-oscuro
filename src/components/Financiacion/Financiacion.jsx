import React from "react";
import { Car, Handshake, Building, CheckCircle, MapPin } from "lucide-react";
import "./Financiacion.css";
import Footer from "../Footer/Footer";

export default function Financiacion() {
  return (
    <div className="financiacion-page">
      {/* Hero / Título */}
      <section className="financiacion-hero">
        <div className="financiacion-hero-content">
          <h1 className="financiacion-title">
            Servicios y Financiación
          </h1>
          <p className="financiacion-subtitle">
            La forma más fácil y segura de llevarte tu próximo auto
          </p>
        </div>
      </section>

      {/* Contenido principal */}
      <section className="financiacion-content">
        <div className="financiacion-grid">
          {/* Tarjeta 1: Financiación Bancaria */}
          <div className="financiacion-card">
            <div className="financiacion-card-icon">
              <Building size={48} />
            </div>
            <h3 className="financiacion-card-title">Financiación Bancaria</h3>
            <p className="financiacion-card-text">
              Crédito prendario, cuota fija y en pesos.  
              <strong>Solo con DNI</strong> y entregando el 50% del valor del auto.  
              <br />
              <strong>¡Consulta tu plan personalizado!</strong>
            </p>
          </div>

          {/* Tarjeta 2: Parte de pago */}
          <div className="financiacion-card">
            <div className="financiacion-card-icon">
              <Handshake size={48} />
            </div>
            <h3 className="financiacion-card-title">Tu auto en parte de pago</h3>
            <p className="financiacion-card-text">
              Recibimos tu vehículo usado como parte del pago.  
              Envía fotos por WhatsApp y te hacemos una cotización rápida y justa.
            </p>
          </div>

          {/* Tarjeta 3: Documentación lista */}
          <div className="financiacion-card">
            <div className="financiacion-card-icon">
              <CheckCircle size={48} />
            </div>
            <h3 className="financiacion-card-title">Carpeta lista para transferir</h3>
            <p className="financiacion-card-text">
              Toda la documentación al día y lista para transferir en el momento.  
              <strong>Seriedad y garantía total</strong> con <strong>gestoría propia</strong>.  
              Entrega de unidades el mismo día.
            </p>
          </div>

          {/* Tarjeta 4: Sucursales */}
          <div className="financiacion-card">
            <div className="financiacion-card-icon">
              <MapPin size={48} />
            </div>
            <h3 className="financiacion-card-title">Concesionario a tu disposición</h3>
            <p className="financiacion-card-text">
              Coordiná tu visita en nuestro concesionario.  
              Amplia variedad de usados, seminuevos y 0km multimarca.  
            </p>
          </div>

          {/* Tarjeta 5: Stock */}
          <div className="financiacion-card">
            <div className="financiacion-card-icon">
              <Car size={48} />
            </div>
            <h3 className="financiacion-card-title">Más de 40 autos seleccionados</h3>
            <p className="financiacion-card-text">
              Vehículos usados en excelente estado para una inversión segura y confiable.  
              Calidad garantizada en cada unidad.
            </p>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="financiacion-cta">
        <h2 className="financiacion-cta-title">¿Listo para tu próximo auto?</h2>
        <p className="financiacion-cta-text">
          Contactanos por WhatsApp o visitanos en nuestras sucursales
        </p>
        <a
          href="https://wa.me/5499112345678?text=Hola!%20Quiero%20consultar%20por%20financiación%20y%20vehículos"
          target="_blank"
          rel="noopener noreferrer"
          className="financiacion-cta-btn"
        >
          Consultar ahora por WhatsApp
        </a>
      </section>
      <Footer />
    </div>    
  );
}