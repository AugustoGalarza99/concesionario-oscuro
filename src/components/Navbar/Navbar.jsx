import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { User, LogOut, Menu, X, Home, Shield, Car, Handshake, Contact,} from "lucide-react";
import logo from "../../../public/dromux-blanco.png";
import "./Navbar.css";

function Navbar() {
  const { user, profile, logout, authLoading, isStaff } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
  await logout();
  setMenuOpen(false);
  navigate("/", { replace: true });
};



  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (authLoading) return null;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* ESPACIO RESERVADO */}
      <div className="navbar-spacer"></div>

      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-container">

          {/* HAMBURGUESA + LOGO MOBILE */}
          <div className="mobile-left">
            <button
              className={`hamburger ${menuOpen ? "active" : ""}`}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className="line"></span>
              <span className="line"></span>
              <span className="line"></span>
            </button>

            <Link to="/" className="logo-mobile" onClick={() => setMenuOpen(false)}>
              <img src={logo} alt="Logo" />
            </Link>
          </div>

          {/* LOGO DESKTOP */}
          <Link to="/" className="logo-desktop" onClick={() => setMenuOpen(false)}>
            <img src={logo} alt="Logo" />
            {/*<span>Dromux</span>*/}
          </Link>

          {/* MENÚ DESKTOP */}
          <ul className="nav-menu">
            <li>
              <Link to="/" className="nav-link">
                <Home size={18} /> Inicio
              </Link>
            </li>
            <li>
              <Link to="/vehiculos" className="nav-link">
                <Car size={18} /> Vehiculos
              </Link>
            </li>
            <li>
              <Link to="/financiacion" className="nav-link">
                <Handshake size={18} /> Financiacion
              </Link>
            </li>
            <li>
              <Link to="/contacto" className="nav-link">
                <Contact size={18} /> Contacto
              </Link>
            </li>

            {isStaff &&(
              <li>
                <Link to="/admin" className="nav-link admin">
                  <Shield size={18} /> Administracion
                </Link>
              </li>
            )}

            <li className="auth-buttons">
              {user ? (
                <>
                  <Link to="/perfil" className="nav-link">
                    <User size={18} /> Perfil
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="nav-link logout"
                  >
                    <LogOut size={18} /> Salir
                  </button>
                </>
              ) : (
                <Link to="/login" className="nav-link login-btn">
                  Iniciar Sesión
                </Link>
              )}
            </li>
          </ul>
        </div>
      </nav>

      {/* OVERLAY MOBILE */}
      <div
        className={`mobile-overlay ${menuOpen ? "active" : ""}`}
        role="presentation"
        onClick={() => setMenuOpen(false)}
      />
      {/* MENÚ MOBILE */}
      <div className={`mobile-menu ${menuOpen ? "active" : ""}`}>
        <div className="mobile-header">
          <Link to="/" onClick={() => setMenuOpen(false)}>
            <img src={logo} alt="Logo" className="mobile-logo-img" />
          </Link>
          <button onClick={() => setMenuOpen(false)} className="close-btn">
            <X size={28} />
          </button>
        </div>

        <div className="mobile-links">
          <Link to="/" onClick={() => setMenuOpen(false)}>
            <Home size={22} /> Inicio
          </Link>
          <Link to="/vehiculos" onClick={() => setMenuOpen(false)}>
            <Car size={22} /> Vehiculos
          </Link>
          <Link to="/financiacion" onClick={() => setMenuOpen(false)}>
            <Handshake size={22} /> Financiacion
          </Link>
          <Link to="/contacto" onClick={() => setMenuOpen(false)}>
            <Contact size={22} /> Contacto
          </Link>

          {isStaff &&(
            <Link
              to="/admin"
              onClick={() => setMenuOpen(false)}
              className="admin-link-mobile"
            >
              <Shield size={22} /> Administración
            </Link>
          )}
        </div>

        <div className="mobile-footer-actions">
          {user ? (
            <>
              <Link
                to="/perfil"
                onClick={() => setMenuOpen(false)}
                className="btn-profile"
              >
                <User size={20} /> Mi Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="btn-logout"
              >
                <LogOut size={20} /> Cerrar Sesión
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="btn-login"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

export default Navbar;
