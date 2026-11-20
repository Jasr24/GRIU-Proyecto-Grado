import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { supabase } from "../lib/supabase";

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

export default function ReportTracking({ session }) {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    async function load() {
      try {
        const current = await api(`/api/reports/${id}`, {}, session);
        setReport(current);
        const { data, error } = await supabase
          .from("report_attachments")
          .select("id,file_name,storage_path,content_type,created_at")
          .eq("report_id", id)
          .order("created_at");
        if (error) throw error;
        const signed = await Promise.all(
          (data || []).map(async (a) => {
            const { data: url } = await supabase.storage
              .from("report-photos")
              .createSignedUrl(a.storage_path, 3600);
            return { ...a, signedUrl: url?.signedUrl };
          }),
        );
        setAttachments(signed);
      } catch (error) {
        setMessage(error.message);
      }
    }
    load();
  }, [id, session]);
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
  const latest = report.updates?.[report.updates.length - 1];
  const responsible =
    report.assigned_to ||
    ["assigned", "in_progress", "resolved"].includes(report.status)
      ? "Asignación registrada"
      : "Pendiente de asignación";
  return (
    <section className="tracking-page">
      <div className="citizen-breadcrumb">
        Ciudadanía&nbsp; / &nbsp;Seguimiento del reporte
      </div>
      <div className="tracking-heading">
        <div>
          <p className="eyebrow">SEGUIMIENTO DEL REPORTE</p>
          <h1>Seguimiento del reporte</h1>
          <p>Consulta la trazabilidad y las novedades de tu solicitud.</p>
        </div>
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
              <dt>Reportado por</dt>
              <dd>{report.profiles?.full_name || "Tu cuenta ciudadana"}</dd>
            </div>
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
                {attachments.length
                  ? `${attachments.length} fotografía(s) adjunta(s)`
                  : "Sin fotografías"}
              </dd>
            </div>
            <div>
              <dt>Área responsable</dt>
              <dd>{responsible}</dd>
            </div>
          </dl>
          <p>Las novedades se muestran en la trazabilidad del reporte.</p>
          <Link className="cancel-button" to="/ciudadano/mis-reportes">
            Ver mis reportes
          </Link>
        </aside>
      </div>
      {attachments.length > 0 && (
        <section className="tracking-evidence">
          <h2>Evidencia fotográfica</h2>
          <div className="attachment-grid">
            {attachments.map((a) => (
              <a key={a.id} href={a.signedUrl} target="_blank" rel="noreferrer">
                <img src={a.signedUrl} alt={a.file_name} />
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
