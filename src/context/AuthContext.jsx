import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useDealership } from "../hooks/useDealership";

const AuthContext = createContext();

/* ===============================
   CACHE HELPERS
================================ */
const roleCacheKey = (userId, dealershipId) =>
  `role_${userId}_${dealershipId}`;

const getCachedRole = (userId, dealershipId) => {
  try {
    return localStorage.getItem(roleCacheKey(userId, dealershipId));
  } catch {
    return null;
  }
};

const setCachedRole = (userId, dealershipId, role) => {
  localStorage.setItem(roleCacheKey(userId, dealershipId), role);
};

const clearCachedRole = (userId, dealershipId) => {
  localStorage.removeItem(roleCacheKey(userId, dealershipId));
};

/* ===============================
   PROVIDER
================================ */
export const AuthProvider = ({ children }) => {
  const { dealershipId, loading: dealershipLoading } = useDealership();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [dealershipRole, setDealershipRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 🔥 NUEVO: fuerza re-render global cuando cambia el rol
  const [roleVersion, setRoleVersion] = useState(0);

  /* ===============================
     INIT AUTH
  ================================ */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  /* ===============================
     LOAD PROFILE (1 vez)
  ================================ */
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, photo_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data) setProfile(data);
    };

    loadProfile();
  }, [user?.id]);

  /* ===============================
     HYDRATE ROLE FROM CACHE
  ================================ */
  useEffect(() => {
    if (!user || !dealershipId) return;

    const cached = getCachedRole(user.id, dealershipId);
    if (cached) {
      setDealershipRole(cached);
    }
  }, [user?.id, dealershipId]);

  /* ===============================
     LOAD ROLE (1 QUERY MAX)
  ================================ */
  useEffect(() => {
    if (!user || !dealershipId) return;
    if (dealershipRole) return;

    const loadRole = async () => {
      const { data } = await supabase
        .from("dealership_users")
        .select("role")
        .eq("user_id", user.id)
        .eq("dealership_id", dealershipId)
        .maybeSingle();

      const role = data?.role ?? "user";
      setDealershipRole(role);
      setCachedRole(user.id, dealershipId, role);

      // 🔥 fuerza actualización global
      setRoleVersion(v => v + 1);

      if (!data) {
        await supabase.from("dealership_users").insert({
          user_id: user.id,
          dealership_id: dealershipId,
          role: "user",
        });
      }
    };

    loadRole();
  }, [user?.id, dealershipId, dealershipRole]);

  /* ===============================
     REALTIME ROLE UPDATES
  ================================ */
  useEffect(() => {
    if (!user || !dealershipId) return;

    const channel = supabase
      .channel(`role-${user.id}-${dealershipId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "dealership_users",
          filter: `user_id=eq.${user.id},dealership_id=eq.${dealershipId}`,
        },
        (payload) => {
          const newRole = payload.new.role;

          setDealershipRole(newRole);
          setCachedRole(user.id, dealershipId, newRole);

          // 🔥 CLAVE: invalida permisos al instante
          setRoleVersion(v => v + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, dealershipId]);

  /* ===============================
     LOGOUT
  ================================ */
  const logout = async () => {
    await supabase.auth.signOut();
    if (user && dealershipId) clearCachedRole(user.id, dealershipId);
    setUser(null);
    setProfile(null);
    setDealershipRole(null);
    setRoleVersion(v => v + 1);
  };

  /* ===============================
     ROLE HELPERS
  ================================ */
  const isAdmin = dealershipRole === "admin";
  const isSeller = dealershipRole === "vendedor";
  const isStaff = isAdmin || isSeller;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        dealershipRole,
        roleVersion, // 👈 EXPUETO
        isAdmin,
        isSeller,
        isStaff,
        authLoading: authLoading || dealershipLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
