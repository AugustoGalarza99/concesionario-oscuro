import React from "react";
import { Link } from "react-router-dom";
import { Car, Image, ShoppingCart, Users, BarChart3, ArrowRight, Info, BookOpenCheck, RefreshCcwDot} from "lucide-react";
import "./Administracion.css";

const adminLinks = [
  { title: "Vehiculos", icon: <Car />, to: "/admin/productos", color: "#6c5ce7" },
  { title: "Banners", icon: <Image />, to: "/admin/fotosbanner", color: "#e91e63" },
  { title: "Registrar venta", icon: <ShoppingCart />, to: "/admin/registro", color: "#00bcd4" },
  { title: "Referencias", icon: <Users />, to: "/admin/referencias", color: "#4caf50" },
  { title: "Dashboard", icon: <BarChart3 />, to: "/admin/dashboard", color: "#ff9800" },
  { title: "Ingreso y egreso", icon: <RefreshCcwDot />, to: "/admin/inventario", color: "#e91e63" },
  { title: "Lead", icon: <BookOpenCheck />, to: "/admin/lead", color: "#9c27b0" },
  { title: "Instrucciones", icon: <Info />, to: "/admin/instrucciones", color: "#607d8b" },
];

function Administracion() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Panel de Administración</h1>
          <p className="dashboard-subtitle">Gestioná tu concesionario con total control</p>
        </header>

        <div className="cards-grid">
          {adminLinks.map((link, index) => (
            <Link
              key={index}
              to={link.to}
              className="card-link"
              style={{ "--card-color": link.color, "--delay": `${index * 0.08}s` }}
            >
              <div className="admin-card">
                <div className="card-bg"></div>
                <div className="card-content">
                  <div className="card-icon" style={{ backgroundColor: link.color + "20" }}>
                    {React.cloneElement(link.icon, { size: 28, strokeWidth: 2 })}
                  </div>
                  <h3 className="card-title">{link.title}</h3>
                  <p className="card-desc">Administrar {link.title.toLowerCase()}</p>
                  <ArrowRight className="card-arrow" size={20} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <footer className="dashboard-footer">
          <p>© {new Date().getFullYear()} • Dromux • Software para concesionarios</p>
        </footer>
      </div>
    </>
  );
}

export default Administracion;