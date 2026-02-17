import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabaseClient";
import { User, Mail, MapPin, Phone, Home, Loader2, CheckCircle, Camera, Hash,} from "lucide-react";
import { toast } from "sonner";
import "./Perfil.css";

function Perfil() {
  const { user, authLoading } = useAuth();
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "",
    dni: "",
    phone: "",
    address: {
      street: "",
      number: "",
      apartment: "",
      city: "",
      province: "",
      zipCode: "",
    },
  });

  /* ===============================
     LOAD PROFILE
  =============================== */
useEffect(() => {
  if (authLoading) return;
  if (!user?.id) return;

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("name, dni, phone, address, photo_url")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("PROFILE LOAD ERROR:", error);
      return;
    }

    if (data) {
      setProfileData({
        name: data.name ?? "",
        dni: data.dni ?? "",
        phone: data.phone ?? "",
        address: data.address ?? {
          street: "",
          number: "",
          apartment: "",
          city: "",
          province: "",
          zipCode: "",
        },
      });
    }
  };

  loadProfile();
}, [user, authLoading]);


  /* ===============================
     SAVE PROFILE
  =============================== */
  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setSaving(true);

    const savePromise = supabase
      .from("profiles")
      .upsert({
        id: user.id,
        name: profileData.name,
        dni: profileData.dni,
        phone: profileData.phone,
        address: profileData.address,
        updated_at: new Date(),
      });

    toast.promise(savePromise, {
      loading: "Guardando perfil...",
      success: "Perfil actualizado correctamente",
      error: "No se pudo guardar el perfil",
    });

    const { error } = await savePromise;

    setSaving(false);

    if (error) {
      console.error("PROFILE SAVE ERROR:", error);
    }
  };

  const getAvatarUrl = () => {
    const name = profileData.name || user?.email || "U";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=6c5ce7&color=fff&size=256`;
  };

  if (authLoading) {
    return (
      <div className="pf-loading">
        <Loader2 size={32} className="spin" />
      </div>
    );
  }

  return (
    <div className="pf-page">
      <div className="pf-container">
        <div className="pf-header">
          <h1 className="pf-title">
            <User size={36} /> Mi Perfil
          </h1>
        </div>

        <div className="pf-card">
          {/* AVATAR */}
          <div className="pf-avatar-section">
            <div className="pf-avatar-wrapper">
              <img src={getAvatarUrl()} className="pf-avatar" />
              <div className="pf-avatar-overlay">
                <Camera size={28} />
              </div>
            </div>
            <div className="pf-user-info">
              <h2>{profileData.name || "Usuario"}</h2>
              <p className="pf-email">
                <Mail size={18} /> {user.email}
              </p>
            </div>
          </div>

          {/* FORM */}
          <div className="pf-form">
            <Input icon={User} label="Nombre completo"
              value={profileData.name}
              onChange={(v) => setProfileData({ ...profileData, name: v })}
            />
            <Input icon={Hash} label="DNI"
              value={profileData.dni}
              onChange={(v) => setProfileData({ ...profileData, dni: v })}
            />
            <Input icon={Phone} label="Teléfono"
              value={profileData.phone}
              onChange={(v) => setProfileData({ ...profileData, phone: v })}
            />

            {/* Address */}
            <Input icon={Home} label="Calle"
              value={profileData.address.street}
              onChange={(v) =>
                setProfileData({
                  ...profileData,
                  address: { ...profileData.address, street: v },
                })
              }
            />
            <Input icon={Home} label="Número"
              value={profileData.address.number}
              onChange={(v) =>
                setProfileData({
                  ...profileData,
                  address: { ...profileData.address, number: v },
                })
              }
            />
            <Input icon={Home} label="Departamento"
              value={profileData.address.apartment}
              onChange={(v) =>
                setProfileData({
                  ...profileData,
                  address: { ...profileData.address, apartment: v },
                })
              }
            />
            <Input icon={MapPin} label="Ciudad"
              value={profileData.address.city}
              onChange={(v) =>
                setProfileData({
                  ...profileData,
                  address: { ...profileData.address, city: v },
                })
              }
            />
            <Input icon={MapPin} label="Provincia"
              value={profileData.address.province}
              onChange={(v) =>
                setProfileData({
                  ...profileData,
                  address: { ...profileData.address, province: v },
                })
              }
            />
            <Input icon={MapPin} label="Código Postal"
              value={profileData.address.zipCode}
              onChange={(v) =>
                setProfileData({
                  ...profileData,
                  address: { ...profileData.address, zipCode: v },
                })
              }
            />

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className={`pf-save-btn ${saving ? "saving" : ""}`}
            >
              {saving ? (
                <>
                  <Loader2 size={22} className="spin" /> Guardando...
                </>
              ) : (
                <>
                  <CheckCircle size={22} /> Guardar cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ icon: Icon, label, value, onChange }) {
  return (
    <div className="pf-input-group">
      <label>
        <Icon size={20} /> {label}
      </label>
      <input
        className="pf-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default Perfil;
