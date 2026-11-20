import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { supabase } from "../lib/supabase";

if (typeof document !== "undefined" && !window.__griuAdminPanelNavigation) {
  window.__griuAdminPanelNavigation = true;
  document.addEventListener("click", (event) => {
    const panelLink = event.target.closest('a.admin-nav[href="/admin"]');
    if (panelLink && window.location.pathname === "/admin")
      window.location.reload();
  });
}

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
const rank = {
  submitted: 0,
  in_review: 1,
  assigned: 2,
  in_progress: 3,
  resolved: 4,
  rejected: 5,
};

export default function AdminManageReport({
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
  const currentRank = rank[report.status] ?? 0;
  const canChoose = (value) =>
    report.status === "resolved" || report.status === "rejected"
      ? value === report.status
      : rank[value] >= currentRank;
  const save = async (event) => {
    event.preventDefault();
    if (!note.trim())
      return setMessage(
        "Escribe una observación para guardar la actualización.",
      );
    setSaving(true);
    setMessage("");
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
      {saving && (
        <div className="fullscreen-loading" role="status" aria-live="polite">
          <span className="fullscreen-spinner" />
          <strong>Guardando actualización...</strong>
          <small>Estamos actualizando el reporte y su trazabilidad.</small>
        </div>
      )}
      <div className="admin-breadcrumb">
        Administración&nbsp; / &nbsp;Gestión del reporte
      </div>
      <div className="admin-title-row">
        <div>
          <p className="eyebrow">GESTIÓN DEL REPORTE</p>
          <h1>Gestión del reporte</h1>
          <p>
            {report.report_code} · {labels[report.status] || report.status}
          </p>
        </div>
        <button className="cancel-button" onClick={onBack} disabled={saving}>
          ← Volver al panel
        </button>
      </div>
      <div className="manage-columns">
        <section className="manage-report-card">
          <div className="manage-badges">
            <span className={`status-pill status-${report.status}`}>
              {labels[report.status] || report.status}
            </span>
            <span className="priority-badge">
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
                <strong>{labels[u.new_status] || u.new_status}</strong>
                <span>{u.note || "Sin observaciones"}</span>
                <small>{new Date(u.created_at).toLocaleString("es-CO")}</small>
              </article>
            ))}
          </div>
        </section>
        <form className="manage-form" onSubmit={save} aria-busy={saving}>
          <h2>Clasificación y actualización</h2>
          <label>
            Prioridad
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={saving}
            >
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </label>
          <label>
            Nuevo estado
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={saving}
            >
              {statuses.map((value) => (
                <option key={value} value={value} disabled={!canChoose(value)}>
                  {labels[value]}
                </option>
              ))}
            </select>
          </label>
          <small>
            Los estados anteriores al estado actual no están disponibles.
          </small>
          <label>
            Observaciones para la ciudadanía *
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe la acción realizada o el siguiente paso."
              required
              disabled={saving}
            />
          </label>
          {message && <p className="message">{message}</p>}
          <button className="submit-button" disabled={saving}>
            {saving ? "Guardando..." : "Guardar actualización"}
          </button>
          <button
            type="button"
            className="cancel-button"
            onClick={onBack}
            disabled={saving}
          >
            Cancelar y volver
          </button>
        </form>
      </div>
    </AdminShell>
  );
}

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
          <span
            className={`admin-nav${active === "Reportes y filtros" ? " active" : ""}`}
          >
            Reportes y filtros
          </span>
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
