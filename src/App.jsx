import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import GestorProductos from "./components/GestorVehiculos/GestorVehiculos";
import Home from "./components/Home/Home";
import Vehiculos from "./components/Vehiculos/Vehiculos";
import VehicleDetail from "./components/VehicleDetail/VehicleDetail";
import Navbar from "./components/Navbar/Navbar";
import Login from "./components/Login/Login";
import Perfil from "./components/Perfil/Perfil";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import AdminBanner from "./components/AdminBanner/AdminBanner";
import GestorCategorias from "./components/GestorCategorias/GestorCategorias";
import CheckoutSuccess from "./components/MercadoPago/CheckoutSuccess/CheckoutSuccess";
import CheckoutFailure from "./components/MercadoPago/CheckoutFailure/CheckoutFailure";
import CheckoutPending from "./components/MercadoPago/CheckoutPending/CheckoutPending";
import RegistroVentas from "./components/RegistroVentas/RegistroVentas";
import ClientesAdmin from "./components/ClientesAdmin/ClientesAdmin";
import Contacto from "./components/Contacto/Contacto";
import Financiacion from "./components/Financiacion/Financiacion";
import AuthCallback from "./pages/auth/AuthCallback";
import ChooseDealership from "./pages/auth/ChooseDealership";
import LogoLoader from "./components/LogoLoader/LogoLoader";
import GestorVehiculos from "./components/GestorVehiculos/GestorVehiculos";
import { Toaster } from "sonner";
import Administracion from "./components/Administracion/Administracion";
import VehiclesEntry from "./components/VehicleEntry/VehicleEntry";
import Leads from "./components/Leads/Leads";
import Instrucciones from "./components/Instrucciones/Instrucciones"


function App() {
  const { authLoading } = useAuth();
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [hideLoader, setHideLoader] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const showLoader = authLoading || !minTimePassed;

  // Bloquear scroll mientras loader está visible
  useEffect(() => {
    document.body.style.overflow = showLoader ? "hidden" : "auto";
  }, [showLoader]);

  // Cuando deja de mostrarse → activamos fade out
  useEffect(() => {
    if (!showLoader) {
      const timer = setTimeout(() => {
        setHideLoader(true); // desmonta después de animar
      }, 800); // duración del fade-out

      return () => clearTimeout(timer);
    }
  }, [showLoader]);

  return (
    <>
      {!hideLoader && <LogoLoader isVisible={showLoader} />}
    <Toaster
      position="top-right"
      style={{ marginTop: "86px" }}
      richColors
      expand
      toastOptions={{
        style: {
          borderRadius: "18px",
          padding: "16px 20px",
          fontSize: "1rem",
          background: "#ffffff",
          color: "#001f3f",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        },
        className: "custom-toast",
      }}
    />
    <Navbar />
        
        <Routes>
          
          {/* Rutas protegidas solo para ADMIN */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin", "vendedor"]}>
                <Administracion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/productos"
            element={
              <ProtectedRoute allowedRoles={["admin", "vendedor"]}>
                <GestorVehiculos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categorias"
            element={
              <ProtectedRoute allowedRoles={["admin", "vendedor"]}>
                <GestorCategorias />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/registro"
            element={
              <ProtectedRoute allowedRoles={["admin", "vendedor"]}>
                <RegistroVentas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/referencias"
            element={
              <ProtectedRoute allowedRoles={["admin", "vendedor"]}>
                <ClientesAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/fotosbanner"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminBanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventario"
            element={
              <ProtectedRoute allowedRoles={["admin", "vendedor"]}>
                <VehiclesEntry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/lead"
            element={
              <ProtectedRoute allowedRoles={["admin", "vendedor"]}>
                <Leads />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/instrucciones"
            element={
              <ProtectedRoute allowedRoles={["admin", "vendedor"]}>
                <Instrucciones />
              </ProtectedRoute>
            }
          />

          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
          

          {/* Rutas accesibles para todos */}
          <Route path="/" element={<Home />} />
          <Route path="/vehiculos" element={<Vehiculos />} />
          <Route path="/vehiculos/:slug" element={<VehicleDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/choose-dealership" element={<ChooseDealership />} />

          <Route path="/contacto" element={<Contacto />} />
          <Route path="/financiacion" element={<Financiacion />} />

          <Route path="/success" element={<CheckoutSuccess />}/>
          <Route path="/failure" element={<CheckoutFailure />} />
          <Route path="/pending" element={<CheckoutPending />} />
        </Routes>
    </>
  );
}

export default App;
