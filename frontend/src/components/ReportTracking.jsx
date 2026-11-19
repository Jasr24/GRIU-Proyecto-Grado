import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";

const labels = {
  submitted: "Recibido",
  in_review: "En revisión",
  assigned: "Asignado",
  in_progress: "En atención",
  resolved: "Resuelto",
  rejected: "Rechazado",
};

export default function ReportTracking({ session }) {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    api(`/api/reports/${id}`, {}, session)
      .then(setReport)
      .catch((e) => setMessage(e.message));
  }, [id]);
  if (message)
    return (
      <section className="page-panel">
        <p className="message">{message}</p>
        <Link className="link-button" to="/ciudadano/mis-reportes">
          ← Volver a mis reportes
        </Link>
      </section>
    );
  if (!report) return <div className="loading">Cargando seguimiento...</div>;
  return (
    <section className="page-panel">
      <div className="page-panel-heading">
        <div>
          <p className="eyebrow">SEGUIMIENTO DEL REPORTE</p>
          <h1>{report.report_code}</h1>
          <p>Consulta el estado y las actualizaciones de tu solicitud.</p>
        </div>
        <Link className="link-button" to="/ciudadano/mis-reportes">
          ← Mis reportes
        </Link>
      </div>
      <div className="tracking-detail">
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
      <h2 className="timeline-title">Historial de cambios</h2>
      <div className="timeline">
        {(report.updates || []).length === 0 ? (
          <p>Aún no hay actualizaciones.</p>
        ) : (
          report.updates.map((update) => (
            <article key={update.id}>
              <strong>{labels[update.new_status] || update.new_status}</strong>
              <span>{update.note || "Sin observaciones"}</span>
              <small>
                {new Date(update.created_at).toLocaleString("es-CO")}
              </small>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
