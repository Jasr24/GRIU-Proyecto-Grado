import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { supabase } from "./lib/supabase";
import { api } from "./services/api";
import Auth from "./components/Auth";
import Citizen from "./components/Citizen";
import Admin from "./components/Admin";
import Landing from "./components/Landing";
import PublicTracking from "./components/PublicTracking";

function AppContent() {
  const navigate = useNavigate();
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
    navigate("/");
  };

  const handleAuth = async (currentSession) => {
    setSession(currentSession);
    await loadRole(currentSession);
    navigate("/");
  };

  if (loading) return <div className="loading">Cargando GRIU...</div>;
  if (!session)
    return (
      <Routes>
        <Route
          path="/"
          element={
            <Landing
              onLogin={() => navigate("/login")}
              onRegister={() => navigate("/registro")}
              onTrack={(code) =>
                navigate(`/seguimiento/${encodeURIComponent(code)}`)
              }
            />
          }
        />
        <Route
          path="/login"
          element={<Auth initialMode="login" onAuth={handleAuth} />}
        />
        <Route
          path="/registro"
          element={<Auth initialMode="register" onAuth={handleAuth} />}
        />
        <Route path="/seguimiento/:code" element={<PublicTracking />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
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

  return (
    <Routes>
      <Route
        path="/admin"
        element={
          role === "admin" ? (
            <Admin session={session} onLogout={logout} />
          ) : (
            <Navigate to="/ciudadano" replace />
          )
        }
      />
      <Route
        path="/ciudadano/*"
        element={
          role === "admin" ? (
            <Navigate to="/admin" replace />
          ) : (
            <Citizen session={session} onLogout={logout} />
          )
        }
      />
      <Route
        path="*"
        element={
          <Navigate to={role === "admin" ? "/admin" : "/ciudadano"} replace />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
