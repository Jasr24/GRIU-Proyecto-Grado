import React, { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../services/api";

const managementStatuses = [
  "submitted",
  "in_review",
  "assigned",
  "in_progress",
];
const labels = {
  submitted: "Recibido",
  in_review: "En revisión",
  assigned: "Asignado",
  in_progress: "En atención",
  resolved: "Resuelto",
  rejected: "Rechazado",
};

export default function CitizenHome({ session }) {
  const { firstName } = useOutletContext();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api("/api/reports", {}, session)
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);
  const stats = useMemo(
    () => ({
      sent: reports.length,
      managing: reports.filter((r) => managementStatuses.includes(r.status))
        .length,
      resolved: reports.filter((r) => r.status === "resolved").length,
    }),
    [reports],
  );
  const recent = reports.slice(0, 3);
  if (loading) return <div className="loading">Cargando reportes...</div>;
  return (
    <>
      <div className="citizen-heading">
        <div>
          <p className="breadcrumb">
            Ciudadanía&nbsp; / &nbsp;Hola, {firstName}
          </p>
          <h1>Hola, {firstName}</h1>
          <p>
            Este es el estado de tus reportes. Gracias por cuidar tu ciudad.
          </p>
        </div>
      </div>
      <div className="citizen-cta">
        <div>
          <h2>Lo que ves hoy puede mejorar mañana.</h2>
          <p>¿Encontraste un incidente? Cuéntanos dónde y qué está pasando.</p>
        </div>
        <Link className="nav-primary" to="/ciudadano/crear-reporte">
          + Crear reporte
        </Link>
      </div>
      <div className="citizen-stats">
        <article>
          <span>Reportes enviados</span>
          <strong>{stats.sent}</strong>
          <small>Tu participación cuenta</small>
        </article>
        <article>
          <span>En gestión</span>
          <strong>{stats.managing}</strong>
          <small>Recibidos, en revisión o atención</small>
        </article>
        <article>
          <span>Resueltos</span>
          <strong>{stats.resolved}</strong>
          <small>Una mejora para tu comunidad</small>
        </article>
      </div>
      <div className="section-heading">
        <h2>Tus reportes recientes</h2>
        {reports.length > 0 && (
          <Link className="link-button" to="/ciudadano/mis-reportes">
            Ver mi historial →
          </Link>
        )}
      </div>
      {recent.length === 0 ? (
        <div className="empty-reports">
          <strong>Aún no tienes reportes.</strong>
          <p>
            Cuando envíes tu primer reporte aparecerá aquí para que puedas
            hacerle seguimiento.
          </p>
          <Link className="nav-primary" to="/ciudadano/crear-reporte">
            Crear mi primer reporte
          </Link>
        </div>
      ) : (
        <div className="reports-table">
          <div className="reports-row reports-header">
            <span>Código</span>
            <span>Incidente</span>
            <span>Categoría</span>
            <span>Fecha</span>
            <span>Estado</span>
          </div>
          {recent.map((report) => (
            <ReportRow key={report.id} report={report} labels={labels} />
          ))}
        </div>
      )}
      <section className="citizen-tip">
        <h2>Un buen reporte nos ayuda a actuar.</h2>
        <p>
          Incluye una dirección precisa, explica el problema y agrega una foto
          sin rostros ni datos personales.
        </p>
        <small>
          Consejo ciudadano · Información para mejorar la gestión de tu reporte.
        </small>
      </section>
    </>
  );
}

function ReportRow({ report, labels }) {
  return (
    <Link
      className="reports-row reports-link"
      to={`/ciudadano/seguimiento/${report.id}`}
    >
      <strong>{report.report_code}</strong>
      <span>{report.title}</span>
      <span>{report.incident_categories?.name || "—"}</span>
      <span>
        {new Intl.DateTimeFormat("es-CO", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(report.created_at))}
      </span>
      <span className={`status-pill status-${report.status}`}>
        {labels[report.status] || report.status}
      </span>
    </Link>
  );
}

export { ReportRow };
