import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { api } from "./services/api";
import Auth from "./components/Auth";
import Citizen from "./components/Citizen";
import Admin from "./components/Admin";

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState("");

  const loadRole = async (currentSession) => {
    setRoleLoading(true);
    setRoleError("");
    if (!currentSession) {
      setRole(null);
      setRoleLoading(false);
      return;
    }
    try {
      const { profile } = await api("/api/me", {}, currentSession);
      if (!profile?.role) throw new Error("Perfil sin rol asignado");
      setRole(profile.role);
    } catch (error) {
      console.error("No fue posible cargar el rol del usuario:", error);
      setRole(null);
      setRoleError(
        "No fue posible determinar el tipo de usuario. Verifica el perfil en la base de datos.",
      );
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadRole(data.session);
      setLoading(false);
    });
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
  };

  const handleAuth = async (currentSession) => {
    setSession(currentSession);
    await loadRole(currentSession);
  };

  if (loading) return <div className="loading">Cargando GRIU...</div>;
  if (!session) return <Auth onAuth={handleAuth} />;
  if (roleLoading)
    return <div className="loading">Verificando permisos...</div>;
  if (roleError)
    return (
      <div className="loading">
        <div>
          <p className="message">{roleError}</p>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      </div>
    );
  return role === "admin" ? (
    <Admin session={session} onLogout={logout} />
  ) : (
    <Citizen session={session} onLogout={logout} />
  );
}
