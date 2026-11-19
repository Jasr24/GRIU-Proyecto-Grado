import React from 'react';

export default function Dashboard({ title, onLogout, children }) {
  return <>
    <header className="topbar">
      <div><strong>GRIU</strong><span>Gestión de incidentes urbanos · Neiva</span></div>
      <button className="link-button" onClick={onLogout}>Cerrar sesión</button>
    </header>
    <main className="page">
      <p className="eyebrow">PARTICIPACIÓN CIUDADANA</p>
      <h1>{title}</h1>
      {children}
    </main>
  </>;
}
