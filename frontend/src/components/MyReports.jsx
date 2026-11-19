import React, { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../services/api";
import { ReportRow } from "./CitizenHome";

export default function MyReports({ session }) {
  const { firstName } = useOutletContext();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  useEffect(() => {
    api("/api/reports", {}, session)
      .then(setReports)
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false));
  }, []);
  return (
    <section className="page-panel">
      <div className="page-panel-heading">
        <div>
          <p className="eyebrow">HISTORIAL CIUDADANO</p>
          <h1>Mis reportes</h1>
          <p>Hola, {firstName}. Aquí puedes consultar todos tus reportes.</p>
        </div>
        <Link className="nav-primary" to="/ciudadano/crear-reporte">
          + Crear reporte
        </Link>
      </div>
      {loading ? (
        <div className="loading">Cargando reportes...</div>
      ) : message ? (
        <p className="message">{message}</p>
      ) : reports.length === 0 ? (
        <div className="empty-reports">
          <strong>Aún no tienes reportes.</strong>
          <p>Empieza creando tu primer reporte ciudadano.</p>
          <Link className="nav-primary" to="/ciudadano/crear-reporte">
            Crear reporte
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
          {reports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              labels={{
                submitted: "Recibido",
                in_review: "En revisión",
                assigned: "Asignado",
                in_progress: "En atención",
                resolved: "Resuelto",
                rejected: "Rechazado",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
