import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Image, ShoppingCart, Users, BarChart3, ArrowRight, Info, BookOpenCheck, RefreshCcwDot, Database, FileChartColumn, NotebookText, Receipt, Lock} from "lucide-react";
import { useModules } from "../../hooks/useModules";
import { toast } from "sonner";
import "./Administracion.css";

const adminLinks = [
  { title: "Publicacion de vehiculos", icon: <Car />, to: "/admin/productos", color: "#6c5ce7" },
  { title: "Banners", icon: <Image />, to: "/admin/fotosbanner", color: "#e91e63" },
  { title: "Registrar venta", icon: <ShoppingCart />, to: "/admin/registro", color: "#00bcd4" },
  { title: "Entregas y reseñas", icon: <Users />, to: "/admin/referencias", color: "#4caf50" },
  { title: "Dashboard", icon: <BarChart3 />, to: "/admin/dashboard", color: "#ff9800" },
  { title: "Administracion de vehiculos", icon: <RefreshCcwDot />, to: "/admin/inventario", color: "#e91e63" },
  { title: "Lead", icon: <BookOpenCheck />, to: "/admin/lead", color: "#9c27b0" },

  { title: "Datero", icon: <Database />, to: "/admin/datero", module:"datero", color: "#d19a01" },
  { title: "Preventa", icon: <FileChartColumn />, to: "/admin/preventa", module:"preventa", color: "#0011ff" },
  { title: "Recibo", icon: <NotebookText />, to: "/admin/recibo", module:"recibos", color: "#4caf50" },
  { title: "Financiacion", icon: <Receipt />, to: "/admin/financiacion", module:"financiacion", color: "#607d8b" },
  
  { title: "Instrucciones", icon: <Info />, to: "/admin/instrucciones", color: "#607d8b" },
];

function Administracion() {

  const { hasModule } = useModules();
  const { modules } = useModules();
  const navigate = useNavigate();

  useEffect(() => {}, [modules]);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Panel de Administración</h1>
          <p className="dashboard-subtitle">Gestioná tu concesionario con total control</p>
        </header>

        <div className="cards-grid">
          {adminLinks.map((link, index) => {
            
            const allowed = !link.module || hasModule(link.module);

            const handleClick = () => {

              if (!allowed) {

                toast.error(
                  "Este módulo no está incluido en su plan. Contacte a su asesor para activarlo."
                );

                return;
              }

              navigate(link.to);
            };

            return (
              <div
                key={index}
                onClick={handleClick}
                className={`card-link ${!allowed ? "locked" : ""}`}
                style={{ "--card-color": link.color, "--delay": `${index * 0.08}s` }}
              >
                <div className="admin-card">
                  <div className="card-bg"></div>

                  <div className="card-content">
                    <div
                      className="card-icon"
                      style={{ backgroundColor: link.color + "20" }}
                    >
                      {React.cloneElement(link.icon, { size: 28, strokeWidth: 2 })}
                    </div>

                    <h3 className="card-title">
                      {link.title}
                      {!allowed && <Lock size={16} style={{ marginLeft: 6, opacity: 0.7 }} />}
                    </h3>

                    <p className="card-desc">
                      {allowed
                        ? `Ver ${link.title.toLowerCase()}`
                        : "Módulo no incluido"}
                    </p>

                    <ArrowRight className="card-arrow" size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <footer className="dashboard-footer">
          <p>© {new Date().getFullYear()} • Dromux • Software para concesionarios</p>
        </footer>
      </div>
    </>
  );
}

export default Administracion;