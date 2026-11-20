import React, { useEffect, useState } from "react";
import { publicApi } from "../services/api";

export default function Landing({ onLogin, onRegister, onTrack }) {
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingMessage, setTrackingMessage] = useState("");
  const [publicStats, setPublicStats] = useState(null);
  useEffect(() => {
    publicApi("/api/public/stats")
      .then(setPublicStats)
      .catch(() =>
        setPublicStats({
          total: 0,
          resolvedPercentage: 0,
          communes: 0,
          featured: null,
        }),
      );
  }, []);
  const submitTracking = (event) => {
    event.preventDefault();
    const code = trackingCode.trim();
    if (!code) return setTrackingMessage("Escribe un código de seguimiento.");
    setTrackingMessage("");
    onTrack(code);
  };
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <div className="brand">
          <strong>GRIU</strong>
          <small>
            NEIVA
            <br />
            <span>Gestión de incidentes urbanos</span>
          </small>
        </div>
        <span className="nav-tag">Una ciudad que escucha</span>
        <div className="nav-actions">
          <button className="outline-button" onClick={onLogin}>
            Iniciar sesión
          </button>
          <button className="nav-primary" onClick={onRegister}>
            Registrarse
          </button>
        </div>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <span className="intro-pill">PARTICIPACIÓN CIUDADANA · NEIVA</span>
          <h1>
            Una mejor ciudad
            <br />
            empieza con tu voz.
          </h1>
          <p>
            Reporta lo que pasa en tu barrio. Haz seguimiento a cada incidente y
            ayúdanos a cuidar Neiva, entre todos.
          </p>
          <div className="hero-actions">
            <button className="nav-primary" onClick={onRegister}>
              Crear mi primer reporte
            </button>
            <button className="outline-button" onClick={onLogin}>
              Iniciar sesión
            </button>
          </div>
          <small>Gratis · Sin filas · Seguimiento transparente</small>
        </div>
        <div className="hero-card">
          <p className="card-eyebrow">DE TU REPORTE A LA SOLUCIÓN</p>
          <div className="sample-report">
            {publicStats?.featured ? (
              <>
                <div className="sample-meta">
                  <strong>{publicStats.featured.report_code}</strong>
                  <span>Resuelto</span>
                </div>
                <h2>{publicStats.featured.title}</h2>
                <p>
                  {publicStats.featured.incident_categories?.name ||
                    "Incidente urbano"}
                  {publicStats.featured.commune
                    ? ` · Comuna ${publicStats.featured.commune}`
                    : ""}
                </p>
                <ul>
                  <li>Reporte recibido</li>
                  <li>Asignado al equipo responsable</li>
                  <li>Solución confirmada por la entidad</li>
                </ul>
              </>
            ) : (
              <>
                <h2>Aún no hay reportes resueltos.</h2>
                <p>
                  Tu reporte puede ser el primero en mostrar una solución para
                  la comunidad.
                </p>
              </>
            )}
          </div>
          <small>Cada reporte cuenta. Cada respuesta también.</small>
        </div>
      </section>

      <section className="landing-stats">
        <div>
          <strong>
            {publicStats ? publicStats.total.toLocaleString("es-CO") : "—"}
          </strong>
          <span>reportes recibidos</span>
        </div>
        <div>
          <strong>
            {publicStats ? `${publicStats.resolvedPercentage} %` : "—"}
          </strong>
          <span>casos resueltos</span>
        </div>
        <div>
          <strong>{publicStats ? publicStats.communes : "—"}</strong>
          <span>comunas conectadas</span>
        </div>
        <div>
          <strong>24/7</strong>
          <span>para reportar</span>
        </div>
      </section>

      <section className="landing-section steps-section">
        <h2>Tu barrio, mejor en tres pasos.</h2>
        <div className="steps-grid">
          <article>
            <strong>01</strong>
            <h3>Cuéntanos qué pasa</h3>
            <p>
              Elige una categoría, describe el incidente y ubícalo en tu barrio.
            </p>
          </article>
          <article>
            <strong>02</strong>
            <h3>Recibe tu código</h3>
            <p>
              Guarda tu número de seguimiento para consultar cualquier novedad.
            </p>
          </article>
          <article>
            <strong>03</strong>
            <h3>Sigue la solución</h3>
            <p>Conoce el estado y las observaciones del equipo responsable.</p>
          </article>
        </div>
      </section>

      <section className="landing-section report-types">
        <h2>¿Qué puedes reportar?</h2>
        <p>Incidentes del espacio público que afectan tu día a día.</p>
        <div className="types-grid">
          <span>
            <b>01</b>Vías y andenes
          </span>
          <span>
            <b>02</b>Alumbrado público
          </span>
          <span>
            <b>03</b>Residuos y aseo
          </span>
          <span>
            <b>04</b>Parques y zonas verdes
          </span>
        </div>
      </section>

      <section className="tracking-section">
        <div>
          <h2>¿Ya tienes un reporte?</h2>
          <p>Consulta el avance con tu código de seguimiento.</p>
        </div>
        <form className="tracking-form" onSubmit={submitTracking}>
          <label htmlFor="tracking-code">Código de seguimiento</label>
          <div className="tracking-controls">
            <input
              id="tracking-code"
              value={trackingCode}
              onChange={(event) =>
                setTrackingCode(event.target.value.toUpperCase())
              }
              placeholder="GRIU-2026-0148"
            />
            <button className="nav-primary" type="submit">
              Consultar reporte
            </button>
          </div>
          {trackingMessage && (
            <small className="tracking-message">{trackingMessage}</small>
          )}
        </form>
      </section>

      <section className="landing-notes">
        <article>
          <h3>Tus datos, protegidos</h3>
          <p>
            La información personal solo se utiliza para gestionar tu solicitud.
          </p>
        </article>
        <article>
          <h3>Transparencia en cada paso</h3>
          <p>Conoce cuándo se recibe, asigna y atiende tu reporte.</p>
        </article>
        <article>
          <h3>¿Es una emergencia?</h3>
          <p>
            GRIU no reemplaza los canales de emergencia. Si hay riesgo
            inmediato, llama al 123.
          </p>
        </article>
      </section>

      <footer className="landing-footer">
        <div>
          GRIU&nbsp; / &nbsp;Neiva, Huila
          <br />
          <span>Gestión de Reportes de Incidentes Urbanos</span>
        </div>
        <div>Privacidad y tratamiento de datos&nbsp; · &nbsp;Accesibilidad</div>
      </footer>
    </main>
  );
}
