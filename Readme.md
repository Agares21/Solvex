# SOLVEX — Gestión de librería

**Sprint 2 backend:** proveedores y compras con recepción transaccional. Consulta el [README del backend](backend/README.md), el [contrato de integración para Diana](docs/api/sprint2-contract.md) y el [informe de resultados y trazabilidad](docs/sprint2-backend.md). El frontend del Sprint 2 se desarrolla de forma independiente; esta ampliación no lo modifica. La documentación del Sprint 1 que sigue se conserva como referencia de su entrega.

Sprint 1: **RF-01 / HU-01 / SCRUM-11**, **RF-02 / HU-02 / SCRUM-12** y **RF-06 / HU-06 / SCRUM-13**, épica SCRUM-5. Productos, ajustes de inventario y consulta de disponibilidad. React → API REST ASP.NET Core 8 → SQL Server. No incluye Flutter, Redis, JWT/RBAC ni PWA.

El [informe del Sprint 1](docs/sprint1.md) contiene resultados, criterios pendientes, registro completo de endpoints, trazabilidad y lista de archivos modificados. El [modelo entidad-relación](docs/modelo-entidad-relacion.md) explica el saldo único y la estrategia transaccional.

## Requisitos

- SDK y runtime ASP.NET Core **8** (un SDK posterior puede compilar net8.0, pero la ejecución necesita el runtime 8).
- Node.js 22.12 o posterior compatible con Vite; aquí se verificó con Node 24.
- SQL Server o SQL Express y una identidad con permisos sobre una base de desarrollo nueva.
- En Windows usar `npm.cmd` si PowerShell bloquea `npm.ps1`.

## Instalación y ejecución (PowerShell)

Desde la raíz del repositorio:

```powershell
dotnet restore backend/Solvex.Api/Solvex.Api.csproj
dotnet tool restore
dotnet user-secrets set "ConnectionStrings:Solvex" 'Server=.\SQLEXPRESS;Database=Solvex;Integrated Security=True;TrustServerCertificate=True' --project backend/Solvex.Api
```

La cadena es un ejemplo local con autenticación Windows. Ajustar servidor y nombre de base; `TrustServerCertificate=True` es para desarrollo local. Para SQL Authentication guardar la contraseña mediante secretos de desarrollo o variables del entorno, nunca en Git. ASP.NET Core no carga archivos `.env` automáticamente. Alternativa a user-secrets:

```powershell
$env:ConnectionStrings__Solvex='Server=.\SQLEXPRESS;Database=Solvex;Integrated Security=True;TrustServerCertificate=True'
```

Revisar las migraciones y el destino antes de aplicarlas. Para una instalación inicial usar una base nueva; si ya ejecutaste HU-01, conservar la misma base y aplicar solo la migración pendiente `AddInventory`. La API no ejecuta migraciones al iniciar. No recrear la base ni aplicar a tablas incompatibles.

```powershell
dotnet ef migrations script --idempotent --project backend/Solvex.Api --output solvex-migrations.sql
dotnet ef database update --project backend/Solvex.Api
dotnet run --project backend/Solvex.Api --launch-profile http
```

API: `http://localhost:5080/api/products`. Swagger UI: `http://localhost:5080/swagger`; OpenAPI JSON: `/swagger/v1/swagger.json`, ambos habilitados solamente en Development. El perfil `http` habilita el origen `http://localhost:5173`. Para otro origen configurar `Cors__AllowedOrigins__0`, `Cors__AllowedOrigins__1`, etc. Los ejemplos de backend están en `backend/.env.example`.

En otra terminal:

```powershell
Copy-Item frontend/.env.example frontend/.env
Set-Location frontend
npm.cmd ci
npm.cmd run dev
```

Abrir `http://localhost:5173`. `VITE_API_BASE_URL` define la URL pública de API y nunca debe contener secretos. Vite carga `.env` al iniciar; reiniciar al cambiarla. `.env.local` tiene prioridad sobre `.env`. El backend es la única fuente de datos; no hay catálogo simulado ni almacenamiento local de productos.

Navegación: **Productos**, **Inventario** (`/inventory`) y **Disponibilidad** (`/availability`). En inventario seleccionar Gestionar sobre un producto para registrar entradas/salidas y ver sus movimientos. Los productos existentes comienzan con saldo cero: registrar una entrada con motivo Conteo inicial para establecer existencias físicas. Los productos inactivos conservan el saldo, pero no admiten movimientos ni se consideran disponibles.

Para compilar y previsualizar:

```powershell
npm.cmd run build
npm.cmd run preview
```

El puerto de preview es diferente: añadir su origen a CORS si se usa contra la API. En despliegue, configurar el servidor web para devolver `index.html` en rutas React y usar HTTPS para web/API. El HTTP de los ejemplos es exclusivo del desarrollo local.

## API y datos

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/products` | 200, todos los productos incluidos inactivos |
| GET | `/api/products/{id}` | 200 o 404 |
| POST | `/api/products` | 201 y cabecera Location |
| PUT | `/api/products/{id}` | 200, conserva estado activo/inactivo |
| PATCH | `/api/products/{id}/deactivate` | 204, idempotente; 404 si no existe |
| PATCH | `/api/products/{id}/activate` | 204, idempotente; 404 si no existe; conserva stock e historial |
| GET | `/api/inventory` | 200, catálogo con existencias |
| GET | `/api/inventory/{productId}` | 200 o 404, saldo del producto |
| GET | `/api/inventory/{productId}/movements` | 200 o 404, últimos 50 movimientos |
| GET | `/api/inventory/movements/{id}` | 200 o 404, detalle del movimiento |
| POST | `/api/inventory/{productId}/movements` | 201 con Location; 400/404/409 |
| POST | `/api/availability` | 200, resultado sin cambios; 400/404 para solicitudes inválidas |

POST y PUT reciben:

```json
{"code":"CUA-001","name":"Cuaderno","description":"Rayado, 100 hojas","price":12.50}
```

Respuesta: los mismos campos más `id` entero e `isActive` booleano. Código y nombre obligatorios; precio obligatorio, no negativo y con dos decimales como máximo; descripción opcional. Límites: código 40, nombre 150, descripción 1000, precio 99999999.99. El código se normaliza a mayúsculas y es único incluso en productos inactivos. Errores: 400 para datos inválidos, 404 inexistente, 409 código duplicado y 500 con mensaje genérico ante fallos inesperados. Los errores usan ProblemDetails; la validación de campos puede incluir `errors`. La base tiene un índice único de código y restricción de precio no negativo.

Estos campos son decisiones iniciales de implementación a validar con el cliente: los documentos no especifican un diccionario de productos. El stock se consulta y actualiza exclusivamente a través del módulo de inventario; editar el catálogo no lo cambia.

Para registrar movimientos se envía `{"type":"Entry","quantity":10,"reason":"Conteo inicial"}` (o `Exit` para salida). Cantidad entera positiva, motivo obligatorio de hasta 300 caracteres; fecha UTC asignada por el servidor. La actualización y el movimiento se guardan en una transacción. SQL comprueba el saldo en el propio UPDATE para impedir existencias negativas o desbordamiento incluso con solicitudes concurrentes.

Para disponibilidad se envía `{"items":[{"productId":1,"quantity":3},{"productId":2,"quantity":5}]}`. Admite de 1 a 100 productos distintos y devuelve solicitado, existencias, suficiente/insuficiente y faltante por producto. No reserva ni descuenta stock. Ver [contratos y decisiones](docs/sprint1.md).

## Estructura

```text
frontend/src/
  pages/          Productos, inventario y disponibilidad
  components/     Formulario y mensajes reutilizables
  services/       Fetch centralizado y APIs del Sprint 1
  types/          Contratos TypeScript
  routes/         Navegación y contenedor de aplicación
  styles/         Identidad visual y reglas responsive
backend/Solvex.Api/
  Controllers/    Endpoints HTTP
  Services/       Reglas y validación de negocio
  Repositories/   Productos, stock y ajustes transaccionales
  Entities/       Product e InventoryMovement
  DTOs/           Contratos de entrada y salida
  Data/           DbContext y migraciones aditivas
  Infrastructure/ Manejo centralizado de errores
tests/unitarios/Solvex.Api.Tests/  Pruebas xUnit del servicio
tests/integracion/                Recorrido HTTP contra SQL Server real
docs/                            Documentación original y decisiones nuevas
modelos/                         Diagramas originales conservados
```

Las carpetas vacías originales bajo `docs/src/frontend` y `docs/src/backend` se conservan; el código ejecutable se encuentra en las carpetas de raíz.

## Pruebas y trazabilidad

```powershell
dotnet test tests/unitarios/Solvex.Api.Tests/Solvex.Api.Tests.csproj
Set-Location frontend
npm.cmd test
npm.cmd run build
```

Integración real, desde la raíz, con API iniciada y una base de desarrollo:

```powershell
$env:SOLVEX_TEST_API_URL='http://localhost:5080/api'
$env:SOLVEX_TEST_ORIGIN='http://localhost:5173'
node tests/integracion/products-smoke.mjs
node tests/integracion/sprint1-smoke.mjs
```

El primer recorrido crea un producto con código único y lo conserva inactivo; verifica HU-01 y CORS. El segundo crea dos productos y movimientos propios, comprueba entradas/salidas concurrentes, validaciones, historial, disponibilidad sin mutaciones y límites de stock. Conserva sus datos de prueba; no elimina ni modifica productos anteriores. Ejecutar únicamente contra una base de desarrollo.

La [matriz del Sprint 1](docs/sprint1.md) relaciona RF-01/RF-02/RF-06 con HU-01/HU-02/HU-06, SCRUM-11/12/13, código y pruebas. La [trazabilidad original de HU-01](docs/hu-01-trazabilidad.md) conserva CP-01. El [cambio a React como único cliente](docs/arquitectura/decision-web-react.md) está registrado como aprobado para esta implementación y pendiente de incorporación formal al C2 y a los ADR.

Verificación realizada el 23/10/2026: backend compilado sin advertencias; **35 pruebas xUnit** con runtime .NET 8.0.32; **10 pruebas Vitest**, incluidas cuatro de componentes; compilación React; ambos recorridos HTTP correctos contra SQL Express en `SolvexHu01Demo`; Swagger generado. La migración conservó los tres productos anteriores; una consulta SQL verificó que cada saldo coincide con sus movimientos. Instalación npm sin vulnerabilidades reportadas. No se pudo verificar visualmente escritorio/móvil porque esta sesión no tiene navegador conectado; las historias no se declaran cerradas formalmente sin esta revisión y la aceptación del cliente.

Para la demostración local se creó `frontend/.env.local` (ignorado por Git) apuntando al puerto 5080, y se descargó un runtime 8 aislado bajo `tmp/dotnet` porque el sistema solo tenía .NET 10. Estos archivos temporales no son requisitos del repositorio. La base `SolvexHu01Demo` conserva los registros de demostración y pruebas; no se modificaron otras bases ni se recreó esta.

En este equipo, para volver a iniciar la demostración con el runtime aislado (desde la raíz):

```powershell
$env:ConnectionStrings__Solvex='Server=.\SQLEXPRESS;Database=SolvexHu01Demo;Integrated Security=True;TrustServerCertificate=True'
$env:Cors__AllowedOrigins__0='http://localhost:5173'
$env:Cors__AllowedOrigins__1='http://127.0.0.1:5173'
$env:ASPNETCORE_ENVIRONMENT='Development'
$env:ASPNETCORE_URLS='http://localhost:5080'
./tmp/dotnet/dotnet.exe backend/Solvex.Api/bin/Debug/net8.0/Solvex.Api.dll
```

## Limitaciones y próximos pasos

- Validar campos, reglas de inventario y criterios propuestos con el cliente; completar los recorridos de las tres historias a tamaños de escritorio, tablet y móvil.
- Incorporar formalmente la decisión web a los ADR, C2 y referencias del SRS. `SolvexFin.pdf` no estaba disponible; se revisaron los otros tres PDFs.
- Autenticación JWT y autorización RBAC están diferidas; esta entrega no cumple todavía RNF-02 ni está preparada para exposición pública como administración.
- Redis, PWA y caché offline no están habilitados. Una futura PWA requerirá diseño explícito para sincronización de transacciones de inventario.
- Catálogo sin paginación de servidor y búsqueda local. El historial devuelve los últimos 50 registros; conserva todos en SQL. La edición concurrente del catálogo usa el último guardado; los ajustes de inventario sí protegen el saldo mediante transacciones y UPDATE condicional.
- Proveedores, compras, pedidos, clientes y maquetas aparecen como pendientes y no tienen pantallas operativas. No hay reservas de stock ni claves de idempotencia para reintentar ajustes automáticamente.
- No se crearon ramas, commits, merges, push ni cambios en Jira. Ramas y commits sugeridos con identificadores SCRUM-12/SCRUM-13 se encuentran en el [informe](docs/sprint1.md).
- CI en GitHub Actions, pruebas visuales de navegador y validación de RNF de rendimiento/disponibilidad corresponden a trabajo posterior.

## Equipo y visión

Miembros:
Arce Chiri Alejandro Gabriel
Pattzy Gomez Diana Tatiana

Visión del proyecto

Convertirse en una herramienta digital confiable para la gestión de la librería, integrando y automatizando sus principales procesos, como el registro de productos, compras, ventas e inventario, con el propósito de optimizar las actividades del negocio y facilitar su administración.
