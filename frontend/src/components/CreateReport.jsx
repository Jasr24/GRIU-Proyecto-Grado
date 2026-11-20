import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { supabase } from "../lib/supabase";

export default function CreateReport({ session }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [form, setForm] = useState({
    category_id: "",
    title: "",
    description: "",
    barrio: "",
    commune: "",
    address: "",
  });

  useEffect(() => {
    api("/api/categories", {}, session)
      .then(setCategories)
      .catch((error) => setMessage(error.message));
  }, [session]);

  const updateField = (field) => (event) =>
    setForm({ ...form, [field]: event.target.value });

  const selectFiles = (selected) => {
    const valid = selected.filter((file) => {
      const validType = ["image/jpeg", "image/png"].includes(file.type);
      const validSize = file.size <= 10 * 1024 * 1024;
      return validType && validSize;
    });
    if (selected.length !== valid.length)
      setMessage("Solo se permiten imágenes JPG o PNG de máximo 10 MB.");
    setFiles(valid.slice(0, 3));
  };

  const chooseFiles = (event) =>
    selectFiles(Array.from(event.target.files || []));
  const dropFiles = (event) => {
    event.preventDefault();
    setDragActive(false);
    selectFiles(Array.from(event.dataTransfer.files || []));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!confirmed)
      return setMessage(
        "Confirma que la información es veraz para enviar el reporte.",
      );
    setLoading(true);
    setMessage("");
    try {
      const report = await api(
        "/api/reports",
        { method: "POST", body: JSON.stringify(form) },
        session,
      );
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${session.user.id}/${report.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("report-photos")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { error: attachmentError } = await supabase
          .from("report_attachments")
          .insert({
            report_id: report.id,
            uploaded_by: session.user.id,
            storage_path: path,
            file_name: file.name,
            content_type: file.type,
          });
        if (attachmentError) throw attachmentError;
      }
      navigate(`/ciudadano/crear-reporte/recibido/${report.id}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="create-report-page">
      <div className="citizen-breadcrumb">
        Ciudadanía&nbsp; / &nbsp;Crear reporte
      </div>
      <div className="page-panel-heading create-report-heading">
        <div>
          <p className="eyebrow">NUEVO REPORTE</p>
          <h1>Crear reporte</h1>
          <p>
            Cuéntanos qué sucede. Los campos marcados con * son obligatorios.
          </p>
        </div>
      </div>
      <div className="report-steps">
        <strong>01&nbsp; Describe y ubica</strong>
        <span>→</span>
        <span>02&nbsp; Envía y recibe tu código</span>
      </div>
      <div className="create-report-grid">
        <form onSubmit={submit} className="report-form create-report-form">
          <section className="report-section">
            <h2>
              <span>01</span> Información del incidente
            </h2>
            <label>
              Categoría *
              <select
                value={form.category_id}
                onChange={updateField("category_id")}
                required
              >
                <option value="">Seleccione una categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Título del reporte *
              <input
                value={form.title}
                onChange={updateField("title")}
                placeholder="Ejemplo: Hueco en la vía"
                required
              />
            </label>
            <label>
              Descripción *
              <textarea
                value={form.description}
                onChange={updateField("description")}
                placeholder="Describe lo que ocurre y cómo afecta a la comunidad"
                maxLength="1000"
                required
              />
            </label>
            <small className="field-hint">
              Describe qué ocurre y desde cuándo.
            </small>
          </section>
          <section className="report-section">
            <h2>
              <span>02</span> ¿Dónde sucede?
            </h2>
            <div className="field-grid">
              <label>
                Barrio *
                <input
                  value={form.barrio}
                  onChange={updateField("barrio")}
                  placeholder="Ejemplo: Cándido Leguízamo"
                  required
                />
              </label>
              <label>
                Comuna
                <select value={form.commune} onChange={updateField("commune")}>
                  <option value="">Seleccione una comuna</option>
                  {Array.from({ length: 10 }, (_, index) => (
                    <option key={index + 1} value={String(index + 1)}>
                      Comuna {index + 1}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Dirección o punto de referencia
              <input
                value={form.address}
                onChange={updateField("address")}
                placeholder="Ejemplo: Calle 19 con carrera 2"
              />
            </label>
            <div className="location-preview">
              <p>UBICACIÓN DEL INCIDENTE</p>
              <strong>
                {form.barrio || "Barrio por confirmar"}
                {form.commune ? ` · Comuna ${form.commune}` : ""}
              </strong>
              <span>
                {form.address || "Dirección o referencia por confirmar"}
              </span>
              <small>Neiva, Huila · Ubicación pendiente de confirmar.</small>
            </div>
          </section>
          <section className="report-section photo-placeholder">
            <h2>
              <span>03</span> Evidencia fotográfica
            </h2>
            <div
              className={`photo-upload${dragActive ? " drag-active" : ""}`}
              onDragOver={(event) => event.preventDefault()}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                if (event.currentTarget === event.target) setDragActive(false);
              }}
              onDrop={dropFiles}
            >
              <label className="photo-picker">
                ↑ Selecciona una o varias fotografías
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={chooseFiles}
                />
              </label>
              <span className="drop-hint">o arrástralas aquí</span>
              <small>
                JPG o PNG · Máximo 10 MB por imagen · Hasta 3 imágenes
              </small>
              {files.length > 0 && (
                <div className="selected-files">
                  {files.map((file) => (
                    <span key={`${file.name}-${file.size}`}>✓ {file.name}</span>
                  ))}
                </div>
              )}
            </div>
          </section>
          <label className="confirmation">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />{" "}
            Confirmo que la información es veraz y no contiene datos sensibles.
          </label>
          <div className="report-actions">
            <button className="submit-button" disabled={loading}>
              {loading ? "Enviando reporte..." : "Enviar reporte"}
            </button>
            <Link className="cancel-button" to="/ciudadano">
              Cancelar
            </Link>
          </div>
          {message && <p className="message">{message}</p>}
        </form>
        <aside className="before-send">
          <h2>Antes de enviar</h2>
          <ul>
            <li>Sé específico: ¿qué ocurre y desde cuándo?</li>
            <li>Confirma el barrio y la dirección.</li>
            <li>La fotografía será opcional cuando se implemente HU-04.</li>
          </ul>
          <div className="emergency-note">
            <strong>¿Hay peligro inmediato?</strong>
            <span>Llama al 123. Este canal no atiende emergencias.</span>
          </div>
          <small>
            Los campos y la evidencia fotográfica muestran el alcance del
            prototipo.
          </small>
        </aside>
      </div>
    </section>
  );
}
