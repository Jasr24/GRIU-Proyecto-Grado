import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import AdminManageReport from "./AdminManageReport";

const statuses = [
  "submitted",
  "in_review",
  "assigned",
  "in_progress",
  "resolved",
  "rejected",
];
const labels = {
  submitted: "Recibido",
  in_review: "En revisión",
  assigned: "Asignado",
  in_progress: "En atención",
  resolved: "Resuelto",
  rejected: "Rechazado",
};

if (typeof document !== "undefined" && !window.__griuReportsNavigation) {
  window.__griuReportsNavigation = true;
  document.addEventListener("click", (event) => {
    const item = event.target.closest(".admin-nav");
    if (
      item &&
      item.textContent.trim() === "Reportes y filtros" &&
      window.location.pathname.startsWith("/admin")
    ) {
      event.preventDefault();
      window.location.href = "/admin/reportes";
    }
  });
}

function AdminReportsShell({ name, onLogout, children }) {
  return (
    <main className="admin-page">
      <header className="admin-header">
        <strong>GRIU</strong>
        <span>NEIVA, HUILA&nbsp; / &nbsp;GESTIÓN ADMINISTRATIVA</span>
        <b>{name}</b>
      </header>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <p>ADMINISTRACIÓN</p>
          <Link className="admin-nav" to="/admin">
            Panel general
          </Link>
          <span className="admin-nav active">Reportes y filtros</span>
          <div className="admin-help">
            <strong>Una respuesta clara genera confianza.</strong>
            <span>
              Registra cada avance para mantener informada a la ciudadanía.
            </span>
          </div>
          <button className="admin-logout" onClick={onLogout}>
            Cerrar sesión →
          </button>
        </aside>
        <section className="admin-main">{children}</section>
      </div>
    </main>
  );
}

export default function AdminReports({ session, onLogout }) {
  const [reports, setReports] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    sector: "",
  });
  const [applied, setApplied] = useState({
    category: "",
    status: "",
    sector: "",
  });
  const load = async () => {
    setLoading(true);
    try {
      const [{ profile: currentProfile }, currentReports] = await Promise.all([
        api("/api/me", {}, session),
        api("/api/reports", {}, session),
      ]);
      setProfile(currentProfile);
      setReports(currentReports);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [session]);
  if (selected)
    return (
      <AdminManageReport
        report={selected}
        session={session}
        adminName={`${profile?.full_name || "Administrador GRIU"} · Administrador`}
        onBack={() => setSelected(null)}
        onSaved={load}
        onLogout={onLogout}
      />
    );
  const categories = [
    ...new Set(reports.map((r) => r.incident_categories?.name).filter(Boolean)),
  ];
  const sectors = [
    ...new Set(
      reports
        .map((r) => (r.commune ? `Comuna ${r.commune}` : r.barrio))
        .filter(Boolean),
    ),
  ];
  const filtered = reports.filter(
    (r) =>
      (!applied.category || r.incident_categories?.name === applied.category) &&
      (!applied.status || r.status === applied.status) &&
      (!applied.sector ||
        (r.commune ? `Comuna ${r.commune}` : r.barrio) === applied.sector),
  );
  const apply = () => setApplied(filters);
  const clear = () => {
    const empty = { category: "", status: "", sector: "" };
    setFilters(empty);
    setApplied(empty);
  };
  const hasFilters = Object.values(applied).some(Boolean);
  return (
    <AdminReportsShell
      name={`${profile?.full_name || "Administrador GRIU"} · Administrador`}
      onLogout={onLogout}
    >
      <div className="admin-breadcrumb">
        Administración&nbsp; / &nbsp;Reportes y filtros
      </div>
      <div className="admin-title-row">
        <div>
          <p className="eyebrow">GESTIÓN ADMINISTRATIVA</p>
          <h1>Reportes y filtros</h1>
          <p>Encuentra y prioriza los incidentes que requieren atención.</p>
        </div>
      </div>
      <section className="admin-filter-panel">
        <div className="admin-section-heading">
          <h2>Filtrar reportes</h2>
          <span>Combina categoría, estado y sector</span>
        </div>
        <div className="filter-grid">
          <label>
            Categoría
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
            >
              <option value="">Todas las categorías</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">Todos los estados</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {labels[item]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sector
            <select
              value={filters.sector}
              onChange={(e) =>
                setFilters({ ...filters, sector: e.target.value })
              }
            >
              <option value="">Todos los sectores</option>
              {sectors.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <button className="nav-primary" onClick={apply}>
            Aplicar filtros
          </button>
        </div>
        {hasFilters && (
          <button className="clear-filters" onClick={clear}>
            Limpiar filtros →
          </button>
        )}
      </section>
      <section className="admin-reports">
        <div className="admin-section-heading">
          <h2>{filtered.length} reportes coinciden con los filtros</h2>
          <span>Todos los incidentes</span>
        </div>
        {loading ? (
          <div className="loading">Cargando reportes...</div>
        ) : filtered.length === 0 ? (
          <p className="empty-admin">
            No hay reportes que coincidan con los filtros.
          </p>
        ) : (
          <div className="admin-table">
            <div className="admin-table-row admin-table-header">
              <span>Código / Fecha</span>
              <span>Incidente</span>
              <span>Categoría</span>
              <span>Sector</span>
              <span>Estado</span>
              <span>Acción</span>
            </div>
            {filtered.map((report) => (
              <div className="admin-table-row" key={report.id}>
                <span>
                  <strong>{report.report_code}</strong>
                  <small>
                    {new Date(report.created_at).toLocaleDateString("es-CO")}
                  </small>
                </span>
                <span>{report.title}</span>
                <span>{report.incident_categories?.name || "—"}</span>
                <span>
                  {report.barrio}
                  {report.commune ? ` · C${report.commune}` : ""}
                </span>
                <span>
                  <em className={`status-pill status-${report.status}`}>
                    {labels[report.status] || report.status}
                  </em>
                </span>
                <span>
                  <button
                    className="manage-button"
                    onClick={() => setSelected(report)}
                  >
                    {["resolved", "rejected"].includes(report.status)
                      ? "Ver"
                      : "Gestionar"}{" "}
                    →
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminReportsShell>
  );
}
