# GRIU Proyecto de Grado

Proyecto de Gestión de Reportes de Incidentes Urbanos para Neiva.

## Estructura

- `database/`: scripts SQL ejecutados en Supabase.
- `backend/`: API Node.js y Express.
- `frontend/`: interfaz React y Vite.

## Desarrollo local

1. Copiar `backend/.env.example` como `backend/.env` y completar las variables de Supabase.
2. Copiar `frontend/.env.example` como `frontend/.env` y completar la URL y la clave pública.
3. En `backend`, ejecutar `npm install` y después `npm run dev`.
4. En `frontend`, ejecutar `npm install` y después `npm run dev`.

OJO: No subir archivos `.env` ni claves privadas al repositorio.
