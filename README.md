# GRIU — Gestión de Reportes de Incidentes Urbanos

GRIU es un prototipo web funcional para registrar, consultar y gestionar incidentes urbanos en Neiva. La plataforma permite que la ciudadanía cree reportes, adjunte evidencias fotográficas y consulte su seguimiento, mientras que el personal administrativo puede revisar los casos, establecer prioridades y actualizar sus estados.

## Integrantes

- José Andres Saavedra Romero
- Ana Milena Serrano Puerto

## Funcionalidades principales

- Registro e inicio de sesión de ciudadanos.
- Acceso administrativo mediante credenciales asignadas.
- Creación de reportes de incidentes urbanos.
- Carga de fotografías como evidencia.
- Generación de códigos de seguimiento.
- Consulta pública y autenticada del estado de un reporte.
- Historial de cambios y trazabilidad.
- Panel administrativo con filtros y gestión de reportes.
- Actualización de prioridad, estado y observaciones.

## Tecnologías utilizadas

- React y Vite para el frontend.
- React Router para la navegación entre pantallas.
- Node.js y Express para el backend.
- Supabase para autenticación, base de datos PostgreSQL y almacenamiento de fotografías.
- GitHub para el control de versiones y la organización del proyecto.
- Render para el despliegue del frontend y el backend.

## Estructura del proyecto

- `database/`: scripts SQL y configuraciones relacionadas con Supabase.
- `backend/`: API desarrollada con Node.js y Express.
- `frontend/`: interfaz web desarrollada con React y Vite.

## Aplicación desplegada

- Frontend: [https://griu-frontend.onrender.com](https://griu-frontend.onrender.com)
- Backend: [https://griu-backend.onrender.com](https://griu-backend.onrender.com)

## Video de demostración

[Ver video de presentación del prototipo en YouTube](https://youtu.be/qtk_UxlE1Ic)

## ETablero GitHub Projects

[Enlace de lectura al tablero GitHub Projects](https://github.com/users/Jasr24/projects/1/views/1)

## Figma

[Enlace general](https://www.figma.com/design/UswCzsEr6RqZ2tahe0t0NJ/GRIU_Prototipo_Fase4_JoseSaavedra_AnaSerrano?node-id=0-1&t=WWvMIBgpEphfvQHW-1)
[Enlace de presentación](https://www.figma.com/proto/UswCzsEr6RqZ2tahe0t0NJ/GRIU_Prototipo_Fase4_JoseSaavedra_AnaSerrano?node-id=2-2&starting-point-node-id=2%3A2&show-proto-sidebar=1&t=dumRuoia9nVznD7N-1)

## Desarrollo local

1. Copiar `backend/.env.example` como `backend/.env` y completar las variables de Supabase.
2. Copiar `frontend/.env.example` como `frontend/.env` y completar la URL y la clave pública.
3. En `backend`, ejecutar:

   ```bash
   npm install
   npm run dev
   ```

4. En otra terminal, dentro de `frontend`, ejecutar:

   ```bash
   npm install
   npm run dev
   ```

5. Abrir en el navegador la URL local indicada por Vite.

## Seguridad

No subir archivos `.env`, contraseñas, tokens, claves privadas ni credenciales administrativas reales al repositorio. Las variables de entorno deben configurarse localmente o directamente en Render.

## Licencia

Este proyecto se distribuye bajo la [Licencia MIT](LICENSE).
