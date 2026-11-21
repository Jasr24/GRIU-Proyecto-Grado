import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { supabase } from "../lib/supabase";
import AdminManageReportScreen from "./AdminManageReport";

const statuses = [
  "submitted",
  "in_review",
  "assigned",
  "in_progress",
  "resolved",
  "rejected",
];
const statusLabels = {
  submitted: "Recibido",
  in_review: "En revisión",
  assigned: "Asignado",
  in_progress: "En atención",
  resolved: "Resuelto",
  rejected: "Rechazado",
};

function AdminShell({ name, active, onLogout, children }) {
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
          <Link
            className={`admin-nav${active === "Panel general" ? " active" : ""}`}
            to="/admin"
          >
            Panel general
          </Link>
          <Link
            className={`admin-nav${active === "Reportes y filtros" ? " active" : ""}`}
            to="/admin/reportes"
          >
            Reportes y filtros
          </Link>
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

export default function Admin({ session, onLogout }) {
  const [reports, setReports] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
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
      <AdminManageReportScreen
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
  const hasFilters = Object.values(applied).some(Boolean);
  const visibleReports = hasFilters ? filtered : filtered.slice(0, 4);
  const stats = {
    received: reports.length,
    active: reports.filter((r) =>
      ["in_review", "assigned", "in_progress"].includes(r.status),
    ).length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    high: reports.filter((r) => r.priority === "high").length,
  };
  const categoryCounts = Object.entries(
    reports.reduce((result, report) => {
      const key = report.incident_categories?.name || "Sin categoría";
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {}),
  );
  const maxCategory = Math.max(1, ...categoryCounts.map((item) => item[1]));
  const name = profile?.full_name || "Administrador GRIU";
  const applyFilters = () => setApplied(filters);
  const clearFilters = () => {
    setFilters({ category: "", status: "", sector: "" });
    setApplied({ category: "", status: "", sector: "" });
  };
  const reviewHigh = () => {
    const high = reports.find((r) => r.priority === "high");
    if (high) setSelected(high);
    else setMessage("No hay reportes con prioridad alta para revisar.");
  };
  return (
    <AdminShell
      name={`${name} · Administrador`}
      active="Panel general"
      onLogout={onLogout}
    >
      <div className="admin-breadcrumb">
        Administración&nbsp; / &nbsp;Panel administrativo
      </div>
      <div className="admin-title-row">
        <div>
          <p className="eyebrow">GESTIÓN ADMINISTRATIVA</p>
          <h1>Panel administrativo</h1>
          <p>Una visión clara de los incidentes urbanos de Neiva.</p>
        </div>
        <button className="nav-primary" onClick={load}>
          Actualizar datos
        </button>
      </div>
      {message && <p className="message">{message}</p>}
      <div className="admin-stats">
        <Stat
          label="Reportes recibidos"
          value={stats.received}
          note="Acumulado disponible"
        />
        <Stat
          label="En gestión"
          value={stats.active}
          note="Requieren seguimiento"
        />
        <Stat
          label="Resueltos"
          value={stats.resolved}
          note="Soluciones confirmadas"
        />
        <Stat
          label="Prioridad alta"
          value={stats.high}
          note="Requieren atención"
        />
      </div>
      {!hasFilters && (
        <div className="admin-middle">
          <section className="category-card">
            <h2>Reportes por categoría</h2>
            {categoryCounts.map(([category, count]) => (
              <div className="category-row" key={category}>
                <span>{category}</span>
                <div>
                  <i
                    style={{
                      width: `${Math.max(8, (count / maxCategory) * 100)}%`,
                    }}
                  />
                </div>
                <b>{count}</b>
              </div>
            ))}
          </section>
          <section className="priority-card">
            <span className="priority-label">Prioridad alta</span>
            <h2>{stats.high} reportes necesitan tu atención.</h2>
            <p>
              Revisa la clasificación, asigna prioridad y registra la siguiente
              acción.
            </p>
            <button
              className="nav-primary"
              onClick={reviewHigh}
              disabled={!stats.high}
            >
              Revisar reporte →
            </button>
          </section>
        </div>
      )}
      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        categories={categories}
        sectors={sectors}
        applyFilters={applyFilters}
        clearFilters={clearFilters}
        hasFilters={hasFilters}
      />
      <section className="admin-reports">
        <div className="admin-section-heading">
          <h2>{hasFilters ? "Reportes filtrados" : "Reportes recientes"}</h2>
          <span>
            {hasFilters
              ? `${filtered.length} resultados`
              : `${Math.min(reports.length, 4)} de ${reports.length} incidentes`}
          </span>
        </div>
        {loading ? (
          <div className="loading">Cargando reportes...</div>
        ) : visibleReports.length === 0 ? (
          <p className="empty-admin">
            No hay reportes que coincidan con los filtros.
          </p>
        ) : (
          <>
            <div className="admin-table">
              <div className="admin-table-row admin-table-header">
                <span>Código / Fecha</span>
                <span>Incidente</span>
                <span>Categoría</span>
                <span>Sector</span>
                <span>Estado</span>
                <span>Acción</span>
              </div>
              {visibleReports.map((report) => (
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
                      {statusLabels[report.status] || report.status}
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
            {!hasFilters && (
              <small className="admin-footnote">
                Mostrando los 4 reportes más recientes.
              </small>
            )}
          </>
        )}
      </section>
    </AdminShell>
  );
}

function Stat({ label, value, note }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
function FilterPanel({
  filters,
  setFilters,
  categories,
  sectors,
  applyFilters,
  clearFilters,
  hasFilters,
}) {
  return (
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
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Todos los estados</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {statusLabels[item]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sector
          <select
            value={filters.sector}
            onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
          >
            <option value="">Todos los sectores</option>
            {sectors.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <button className="nav-primary" onClick={applyFilters}>
          Aplicar filtros
        </button>
      </div>
      {hasFilters && (
        <button className="clear-filters" onClick={clearFilters}>
          Limpiar filtros →
        </button>
      )}
    </section>
  );
}

function AdminManageReport({
  report: initialReport,
  session,
  adminName,
  onBack,
  onSaved,
  onLogout,
}) {
  const [report, setReport] = useState(initialReport);
  const [attachments, setAttachments] = useState([]);
  const [status, setStatus] = useState(initialReport.status);
  const [priority, setPriority] = useState(initialReport.priority || "medium");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api(`/api/reports/${initialReport.id}`, {}, session)
      .then(setReport)
      .catch((e) => setMessage(e.message));
    supabase
      .from("report_attachments")
      .select("id,file_name,storage_path")
      .eq("report_id", initialReport.id)
      .order("created_at")
      .then(async ({ data, error }) => {
        if (error) return setMessage(error.message);
        const signed = await Promise.all(
          (data || []).map(async (a) => {
            const { data: url } = await supabase.storage
              .from("report-photos")
              .createSignedUrl(a.storage_path, 3600);
            return { ...a, signedUrl: url?.signedUrl };
          }),
        );
        setAttachments(signed);
      });
  }, [initialReport.id, session]);
  const save = async (e) => {
    e.preventDefault();
    if (!note.trim())
      return setMessage(
        "Escribe una observación para guardar la actualización.",
      );
    setSaving(true);
    try {
      await api(
        `/api/reports/${report.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status, priority, note: note.trim() }),
        },
        session,
      );
      await onSaved();
      onBack();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <AdminShell
      name={adminName}
      active="Reportes y filtros"
      onLogout={onLogout}
    >
      <div className="admin-breadcrumb">
        Administración&nbsp; / &nbsp;Gestión del reporte
      </div>
      <div className="admin-title-row">
        <div>
          <p className="eyebrow">GESTIÓN DEL REPORTE</p>
          <h1>Gestión del reporte</h1>
          <p>
            {report.report_code} ·{" "}
            {statusLabels[report.status] || report.status}
          </p>
        </div>
        <button className="cancel-button" onClick={onBack}>
          ← Volver al panel
        </button>
      </div>
      <div className="manage-columns">
        <section className="manage-report-card">
          <div className="manage-badges">
            <span className={`status-pill status-${report.status}`}>
              {statusLabels[report.status] || report.status}
            </span>
            <span className={`priority-badge priority-${report.priority}`}>
              {report.priority === "high"
                ? "Alta"
                : report.priority === "low"
                  ? "Baja"
                  : "Media"}
            </span>
          </div>
          <h2>{report.title}</h2>
          <p>
            {report.barrio}
            {report.commune ? ` · Comuna ${report.commune}` : ""}
            {report.incident_categories?.name
              ? ` · ${report.incident_categories.name}`
              : ""}
          </p>
          <div className="manage-description">{report.description}</div>
          <dl className="manage-details">
            <div>
              <dt>Ubicación</dt>
              <dd>{report.address || "No indicada"}</dd>
            </div>
            <div>
              <dt>Reportado por</dt>
              <dd>{report.profiles?.full_name || "Ciudadano GRIU"}</dd>
            </div>
          </dl>
          {attachments.length > 0 && (
            <section className="manage-attachments">
              <h3>Evidencia fotográfica</h3>
              <div className="attachment-grid">
                {attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img src={a.signedUrl} alt={a.file_name} />
                    <span>{a.file_name}</span>
                  </a>
                ))}
              </div>
            </section>
          )}
          <h3 className="manage-trace-title">Trazabilidad</h3>
          <div className="timeline">
            {(report.updates || []).map((u) => (
              <article key={u.id}>
                <strong>{statusLabels[u.new_status] || u.new_status}</strong>
                <span>{u.note || "Sin observaciones"}</span>
                <small>{new Date(u.created_at).toLocaleString("es-CO")}</small>
              </article>
            ))}
          </div>
        </section>
        <form className="manage-form" onSubmit={save}>
          <h2>Clasificación y actualización</h2>
          <label>
            Prioridad
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </label>
          <label>
            Nuevo estado
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Observaciones para la ciudadanía *
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe la acción realizada o el siguiente paso."
              required
            />
          </label>
          <small>
            Esta observación será visible en el seguimiento ciudadano.
          </small>
          {message && <p className="message">{message}</p>}
          <button className="submit-button" disabled={saving}>
            {saving ? "Guardando..." : "Guardar actualización"}
          </button>
          <button type="button" className="cancel-button" onClick={onBack}>
            Cancelar y volver
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
