import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import Citizen from "./components/Citizen";
import Admin from "./components/Admin";

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRole = async (currentSession) => {
    if (!currentSession) {
      setRole(null);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentSession.user.id)
      .single();
    setRole(profile?.role || "citizen");
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
  return role === "admin" ? (
    <Admin session={session} onLogout={logout} />
  ) : (
    <Citizen session={session} onLogout={logout} />
  );
}
