import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const labels = {
  submitted: "Reporte recibido",
  in_review: "En revisión",
  assigned: "Asignado",
  in_progress: "En atención",
  resolved: "Resuelto",
  rejected: "Rechazado",
};
const stages = [
  {
    status: "submitted",
    title: "Reporte recibido",
    note: "Recibimos tu reporte y generamos el código de seguimiento.",
  },
  {
    status: "in_review",
    title: "En revisión",
    note: "Se validarán los datos y el área responsable.",
  },
  {
    status: "in_progress",
    title: "En atención",
    note: "El equipo asignado gestionará el incidente.",
  },
  {
    status: "resolved",
    title: "Resuelto",
    note: "Se publicará el resultado y la evidencia de atención.",
  },
];
const rank = {
  submitted: 1,
  in_review: 2,
  assigned: 2,
  in_progress: 3,
  resolved: 4,
  rejected: 4,
};

export default function PublicTracking() {
  const { code } = useParams();
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch(`${API}/api/public/reports/${encodeURIComponent(code)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error || "No fue posible consultar el reporte");
        return body;
      })
      .then(setReport)
      .catch((error) => setMessage(error.message));
  }, [code]);
  if (message)
    return (
      <main className="public-tracking-page">
        <PublicHeader />
        <section className="public-tracking-content">
          <div className="public-error">
            <p>{message}</p>
            <Link className="nav-primary" to="/">
              ← Volver al inicio
            </Link>
          </div>
        </section>
      </main>
    );
  if (!report)
    return (
      <main className="public-tracking-page">
        <PublicHeader />
        <div className="loading">Consultando reporte...</div>
      </main>
    );
  const latest = report.updates?.[report.updates.length - 1];
  const responsible = ["assigned", "in_progress", "resolved"].includes(
    report.status,
  )
    ? "Asignación registrada"
    : "Pendiente de asignación";
  return (
    <main className="public-tracking-page">
      <PublicHeader />
      <section className="public-tracking-content">
        <div className="public-tracking-heading">
          <div>
            <p className="eyebrow">SEGUIMIENTO DEL REPORTE</p>
            <h1>Seguimiento del reporte</h1>
            <p>Consulta la trazabilidad y las novedades de tu solicitud.</p>
          </div>
          <Link className="link-button" to="/">
            ← Volver al inicio
          </Link>
        </div>
        <div className="tracking-columns">
          <div className="tracking-main-card">
            <div className="tracking-report-title">
              <div>
                <strong>{report.report_code}</strong>
                <span className={`status-pill status-${report.status}`}>
                  {labels[report.status] || report.status}
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
            </div>
            <StageList report={report} />
          </div>
          <aside className="tracking-side-card">
            <h2>Datos del reporte</h2>
            <dl>
              <div>
                <dt>Dirección</dt>
                <dd>{report.address || "No indicada"}</dd>
              </div>
              <div>
                <dt>Sector</dt>
                <dd>
                  {report.barrio}
                  {report.commune ? ` · Comuna ${report.commune}` : ""}
                </dd>
              </div>
              <div>
                <dt>Evidencia</dt>
                <dd>
                  {report.attachments?.length
                    ? `${report.attachments.length} fotografía(s) adjunta(s)`
                    : "Sin fotografías"}
                </dd>
              </div>
              <div>
                <dt>Área responsable</dt>
                <dd>{responsible}</dd>
              </div>
            </dl>
            <p>Las novedades se muestran en la trazabilidad del reporte.</p>
            <Link className="cancel-button" to="/">
              Volver al inicio
            </Link>
          </aside>
        </div>
        {report.attachments?.length > 0 && (
          <section className="tracking-evidence">
            <h2>Evidencia fotográfica</h2>
            <div className="attachment-grid">
              {report.attachments.map((a) => (
                <a
                  key={a.id}
                  href={a.signed_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img src={a.signed_url} alt={a.file_name} />
                  <span>{a.file_name}</span>
                </a>
              ))}
            </div>
          </section>
        )}
        <section className="latest-update">
          <h2>Última novedad</h2>
          <small>
            {latest
              ? new Date(latest.created_at).toLocaleString("es-CO")
              : "Sin novedades"}
          </small>
          <p>
            {latest?.note ||
              "Tu reporte fue recibido correctamente. Aún no hay observaciones del equipo de atención."}
          </p>
        </section>
      </section>
    </main>
  );
}

function StageList({ report }) {
  const currentRank = rank[report.status] || 1;
  return (
    <div className="stage-list">
      {stages.map((stage, index) => {
        const done = currentRank >= rank[stage.status];
        const update = report.updates?.find(
          (item) =>
            item.new_status === stage.status ||
            (stage.status === "in_review" && item.new_status === "assigned"),
        );
        return (
          <article
            key={stage.status}
            className={done ? "stage-card stage-done" : "stage-card"}
          >
            <b>{String(index + 1).padStart(2, "0")}</b>
            <div>
              <strong>{stage.title}</strong>
              <small>
                {update
                  ? new Date(update.created_at).toLocaleString("es-CO")
                  : "Pendiente"}
              </small>
              <span>{update?.note || stage.note}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
function PublicHeader() {
  return (
    <header className="public-tracking-header">
      <Link to="/" className="public-brand">
        GRIU
      </Link>
      <span>NEIVA, HUILA&nbsp; / &nbsp;PORTAL CIUDADANO</span>
      <Link to="/login" className="outline-button">
        Iniciar sesión
      </Link>
    </header>
  );
}
