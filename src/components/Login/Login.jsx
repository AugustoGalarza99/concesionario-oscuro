import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { toast } from "sonner";
import { useDealership } from "../../hooks/useDealership";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { dealershipId } = useDealership();

  const [mode, setMode] = useState("login"); // login | signup | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* ============================
     LOGIN
  ============================ */
  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warning("Completá email y contraseña");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      const msg = error.message.toLowerCase();

      if (msg.includes("invalid login credentials")) {
        toast.error("El email o la contraseña son incorrectos");
      } else if (msg.includes("email not confirmed")) {
        toast.warning("Tenés que confirmar tu email antes de ingresar");
      } else {
        toast.error("No se pudo iniciar sesión");
        console.error("LOGIN ERROR:", error);
      }

      return;
    }

    if (!data?.session) {
      toast.error("La cuenta no existe, tenés que crearla");
      return;
    }

    toast.success("Bienvenido 👋");
    navigate("/");
  };

  /* ============================
     SIGNUP
  ============================ */
  const handleSignup = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warning("Completá email y contraseña");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/login",
      },
    });

    setLoading(false);

    if (error) {
      toast.error("No se pudo crear la cuenta");
      console.error("SIGNUP ERROR:", error);
      return;
    }

    if (!data.user) {
      toast.error("Error creando usuario");
      return;
    }

    const userId = data.user.id;

    // Crear profile
    await supabase.from("profiles").insert({
      id: userId,
      name: "",
      photo_url: "",
    });

    // Crear dealership_user
    if (dealershipId) {
      await supabase.from("dealership_users").insert({
        user_id: userId,
        dealership_id: dealershipId,
        role: "user",
      });
    }

    toast.success("Cuenta creada ✅ Revisá tu email");
    setMode("login");
    setEmail("");
    setPassword("");
  };

  /* ============================
     RESET PASSWORD
  ============================ */
  const handleReset = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.warning("Ingresá tu email");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/login",
    });

    setLoading(false);

    if (error) {
      toast.error("No se pudo enviar el email");
      console.error("RESET ERROR:", error);
      return;
    }

    toast.success("Email enviado ✅ Revisá tu bandeja");
    setMode("login");
    setEmail("");
  };

  return (
    <div className="login">
      <div className="form">
        <h2>
          {mode === "login" && "Iniciar sesión"}
          {mode === "signup" && "Crear cuenta"}
          {mode === "reset" && "Recuperar contraseña"}
        </h2>

        <form
          onSubmit={
            mode === "login"
              ? handleEmailLogin
              : mode === "signup"
              ? handleSignup
              : handleReset
          }
        >
          <div className="flex-column">
            <label>Email</label>
            <div className="inputForm">
              <FaEnvelope className="icon" />
              <input
                type="email"
                className="input"
                placeholder="Ingresá tu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {(mode === "login" || mode === "signup") && (
            <div className="flex-column">
              <label>Contraseña</label>
              <div className="inputForm">
                <FaLock className="icon" />
                <input
                  type="password"
                  className="input"
                  placeholder="Ingresá tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <button className="button-submit" disabled={loading}>
            {loading
              ? "Procesando..."
              : mode === "login"
              ? "Ingresar"
              : mode === "signup"
              ? "Crear cuenta"
              : "Enviar email"}
          </button>
        </form>

        <div className="auth-links">
          {mode === "login" && (
            <>
              <p>
                ¿No tenés cuenta?{" "}
                <span onClick={() => setMode("signup")}>Crear cuenta</span>
              </p>
              <p>
                Olvidé mi contraseña{" "}
                <span onClick={() => setMode("reset")}>Recuperar</span>
              </p>
            </>
          )}

          {mode !== "login" && (
            <p>
              Volver a{" "}
              <span onClick={() => setMode("login")}>Iniciar sesión</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
