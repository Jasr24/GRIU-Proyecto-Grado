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

export default function ReportCreated({ session }) {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api(`/api/reports/${id}`, {}, session)
      .then(setReport)
      .catch((error) => setMessage(error.message));
  }, [id, session]);

  if (message)
    return (
      <section className="page-panel">
        <p className="message">{message}</p>
        <Link className="link-button" to="/ciudadano">
          ← Volver al inicio
        </Link>
      </section>
    );
  if (!report) return <div className="loading">Cargando confirmación...</div>;

  return (
    <section className="created-report-page">
      <div className="citizen-breadcrumb">
        Ciudadanía&nbsp; / &nbsp;Reporte enviado
      </div>
      <div className="page-panel-heading">
        <div>
          <p className="eyebrow">REPORTE RECIBIDO</p>
          <h1>Reporte enviado</h1>
          <p>Tu participación ya hace parte de la solución.</p>
        </div>
      </div>
      <div className="created-report-card">
        <p className="eyebrow">✓ REPORTE RECIBIDO</p>
        <h2>Gracias por cuidar Neiva.</h2>
        <p>
          Registramos tu incidente. El equipo revisará la información para
          asignarlo al área responsable.
        </p>
        <div className="tracking-code-card">
          <small>GUARDA TU CÓDIGO DE SEGUIMIENTO</small>
          <strong>{report.report_code}</strong>
          <span>{new Date(report.created_at).toLocaleString("es-CO")}</span>
        </div>
        <div className="created-report-summary">
          <span>
            <b>INCIDENTE</b>
            {report.title}
          </span>
          <span>
            <b>UBICACIÓN</b>
            {report.barrio}
            {report.commune ? ` · Comuna ${report.commune}` : ""}
          </span>
          <span>
            <b>ESTADO ACTUAL</b>
            {labels[report.status] || report.status}
          </span>
        </div>
        <div className="created-report-actions">
          <Link
            className="nav-primary"
            to={`/ciudadano/seguimiento/${report.id}`}
          >
            Ver seguimiento →
          </Link>
          <Link className="cancel-button" to="/ciudadano/mis-reportes">
            Ir a mis reportes
          </Link>
        </div>
        <small className="created-notice">
          Podrás consultar las actualizaciones del reporte desde Seguimiento.
        </small>
      </div>
      <div className="created-next-step">
        <h2>¿Qué pasa ahora?</h2>
        <p>
          Validaremos la categoría y la ubicación. Después podrás consultar la
          asignación, las observaciones y el avance desde Seguimiento.
        </p>
      </div>
    </section>
  );
}
