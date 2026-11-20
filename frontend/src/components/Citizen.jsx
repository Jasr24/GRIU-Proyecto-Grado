import React from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  NavLink,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import CitizenHome from "./CitizenHome";
import CreateReport from "./CreateReport";
import MyReports from "./MyReports";
import ReportTracking from "./ReportTracking";
import ReportCreated from "./ReportCreated";
import { api } from "../services/api";

export default function Citizen({ session, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/me", {}, session)
      .then(({ profile: currentProfile }) => setProfile(currentProfile))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="loading">Cargando tu espacio ciudadano...</div>;
  return (
    <Routes>
      <Route element={<CitizenLayout profile={profile} onLogout={onLogout} />}>
        <Route index element={<CitizenHome session={session} />} />
        <Route
          path="crear-reporte"
          element={<CreateReport session={session} />}
        />
        <Route
          path="crear-reporte/recibido/:id"
          element={<ReportCreated session={session} />}
        />
        <Route path="mis-reportes" element={<MyReports session={session} />} />
        <Route
          path="seguimiento/:id"
          element={<ReportTracking session={session} />}
        />
        <Route path="*" element={<Navigate to="/ciudadano" replace />} />
      </Route>
    </Routes>
  );
}

function CitizenLayout({ profile, onLogout }) {
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "ciudadano";
  const location = useLocation();
  const trackingOpen = location.pathname.startsWith("/ciudadano/seguimiento/");
  const linkClass = ({ isActive }) =>
    `sidebar-link${isActive ? " active" : ""}`;
  return (
    <main className="citizen-page">
      <header className="citizen-header">
        <strong>GRIU</strong>
        <span>NEIVA, HUILA&nbsp; / &nbsp;PORTAL CIUDADANO</span>
        <span className="citizen-user">{profile?.full_name || firstName}</span>
      </header>
      <div className="citizen-layout">
        <aside className="citizen-sidebar">
          <p className="sidebar-label">MI ESPACIO</p>
          <NavLink className={linkClass} to="/ciudadano" end>
            Inicio
          </NavLink>
          <NavLink className={linkClass} to="/ciudadano/crear-reporte">
            Crear reporte
          </NavLink>
          <NavLink className={linkClass} to="/ciudadano/mis-reportes">
            Mis reportes
          </NavLink>
          {trackingOpen ? (
            <span className="sidebar-link active">Seguimiento</span>
          ) : (
            <span className="sidebar-link sidebar-disabled">Seguimiento</span>
          )}
          <div className="sidebar-help">
            <strong>Tu voz mejora Neiva.</strong>
            <span>
              ¿Riesgo inmediato?
              <br />
              Llama al 123.
            </span>
          </div>
          <button className="sidebar-logout" onClick={onLogout}>
            Cerrar sesión →
          </button>
        </aside>
        <section className="citizen-main">
          <Outlet context={{ profile, firstName }} />
        </section>
      </div>
    </main>
  );
}
