import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const labels = {
  submitted: "Recibido",
  in_review: "En revisión",
  assigned: "Asignado",
  in_progress: "En atención",
  resolved: "Resuelto",
  rejected: "Rechazado",
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
  return (
    <main className="public-tracking-page">
      <header className="public-tracking-header">
        <Link to="/" className="public-brand">
          GRIU
        </Link>
        <span>NEIVA, HUILA&nbsp; / &nbsp;PORTAL CIUDADANO</span>
        <Link to="/login" className="outline-button">
          Iniciar sesión
        </Link>
      </header>
      <section className="public-tracking-content">
        {message ? (
          <div className="public-error">
            <p>{message}</p>
            <Link className="nav-primary" to="/">
              ← Volver al inicio
            </Link>
          </div>
        ) : !report ? (
          <div className="loading">Consultando reporte...</div>
        ) : (
          <>
            <div className="public-tracking-heading">
              <div>
                <p className="eyebrow">SEGUIMIENTO DEL REPORTE</p>
                <h1>{report.report_code}</h1>
                <p>Consulta el estado y las actualizaciones de tu solicitud.</p>
              </div>
              <Link className="link-button" to="/">
                ← Volver al inicio
              </Link>
            </div>
            <div className="tracking-detail public-detail">
              <h2>{report.title}</h2>
              <p>{report.description}</p>
              <div className="detail-grid">
                <span>
                  <b>Categoría</b>
                  {report.incident_categories?.name || "—"}
                </span>
                <span>
                  <b>Ubicación</b>
                  {report.barrio}
                  {report.commune ? ` · Comuna ${report.commune}` : ""}
                  {report.address ? ` · ${report.address}` : ""}
                </span>
                <span>
                  <b>Estado actual</b>
                  <em className={`status-pill status-${report.status}`}>
                    {labels[report.status] || report.status}
                  </em>
                </span>
              </div>
            </div>
            {report.attachments?.length > 0 && (
              <>
                <h2 className="timeline-title">Evidencia fotográfica</h2>
                <div className="attachment-grid">
                  {report.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.signed_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={attachment.signed_url}
                        alt={attachment.file_name}
                      />
                      <span>{attachment.file_name}</span>
                    </a>
                  ))}
                </div>
              </>
            )}
            <h2 className="timeline-title">Historial de cambios</h2>
            <div className="timeline">
              {(report.updates || []).map((update) => (
                <article key={update.id}>
                  <strong>
                    {labels[update.new_status] || update.new_status}
                  </strong>
                  <span>{update.note || "Sin observaciones"}</span>
                  <small>
                    {new Date(update.created_at).toLocaleString("es-CO")}
                  </small>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
