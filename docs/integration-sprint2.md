# Integración Sprint 2 — 11/11/2026

Rama: `integration/sprint2`. Orígenes: backend `feature/sprint2-backend` (3509647) y frontend `Tpg_front` (b036368). Se conserva la ascendencia de ambas ramas mediante un merge, sin modificar main.

## Resolución

El único conflicto textual del merge fue `.gitignore`. Se conservaron las exclusiones de .NET, dependencias, .env, compilaciones y temporales, y se añadieron las exclusiones pertinentes del frontend sin ignorar soluciones .sln.

El prototipo de Diana creaba otra aplicación Vite en la raíz, con proveedores/compras de ejemplo en memoria. Se ubicaron sus componentes y estilos en `frontend/src/features/sprint2/`, se conservaron sus recursos en frontend/public y se conectaron los formularios a los contratos reales del backend mediante `frontend/src/services/purchasing.ts`. Las reglas CSS del prototipo se limitaron a `.sprint2` para conservar el diseño de Productos e Inventario. Se mantiene un único router, cliente HTTP y punto de entrada en frontend; los scripts raíz delegan allí. Los archivos de scaffolding Vite/ESLint duplicados se retiraron y el README original de Diana se conserva como referencia en `docs/frontend-diana-prototipo.md`; su historial original permanece en Git.

Se incorporaron los cambios locales de activar/desactivar productos y su prueba. Antes de iniciar se guardó una copia con `git stash push --include-untracked`, mensaje `respaldo frontend local antes de integration sprint2`. El stash se conserva como respaldo incluso después de integrar su contenido; no debe aplicarse otra vez sobre esta rama porque esos cambios ya están incluidos.

## Ajustes al contrato

- Proveedores: identificador único (no se impone NIT), nombre, contacto, teléfono, correo y dirección. Basta teléfono o correo. Se retiraron categorías/observaciones que no existen en la API, para evitar mostrar campos que no se guardarían. El detalle se obtiene por ID; el directorio y los contadores usan datos persistidos.
- Compras: los proveedores y productos se seleccionan por ID desde la API. Solo se ofrecen productos activos. Al registrar se envían supplierId y details con productId, quantity y unitCost. La fecha y el estado los asigna el servidor; no se permite declarar una compra recibida sin ejecutar recepción.
- Los totales de listado y detalle son los calculados por el servidor. El formulario muestra únicamente una estimación previa.
- Recibir exige confirmación y espera al servidor; el botón se bloquea durante la operación y desaparece para compras Received. Ante conflicto se vuelve a consultar el estado. Saldo e historial se mantienen en el backend transaccional existente.
- Los errores de ProblemDetails se muestran en formularios y listados; se añaden estados de carga, listas vacías y reintentos. Los diálogos devuelven foco, contienen tabulación y permiten Escape/cerrar salvo durante guardado.

## Pruebas ejecutadas

| Verificación | Resultado |
| --- | --- |
| Compilación TypeScript + Vite | Correcta |
| Frontend unitario/componentes | 15 aprobadas, incluidas activación y cuatro pruebas nuevas de proveedores/compras |
| Backend unitario | 58 aprobadas |
| Backend SQL real | 5 aprobadas: persistencia, recepción única, concurrencia y rollback |
| Recorridos HTTP | products-smoke, sprint1-smoke y sprint2-smoke aprobados |
| React → API → SQL | Una prueba aprobada sin mocks de HTTP ni repositorios |

La última prueba (`frontend/integration/sprint2-api.test.tsx`) completa el formulario de proveedor, vuelve a montar la página para comprobar persistencia, registra una compra con un producto propio, abre el detalle y recibe la compra. Verifica en la API un saldo incrementado exactamente cinco unidades y un solo movimiento; un segundo intento responde 409. Se ejecuta por separado con `npm.cmd run test:api` para que las pruebas ordinarias no dependan de una API iniciada.

Los tests reales conservan sus datos propios en la base de desarrollo SolvexHu01Demo, sin borrar/recrear bases ni cambiar registros anteriores. La primera ejecución unitaria de backend dentro del sandbox abortó por comunicación testhost; la repetición con permisos de red locales pasó las 58 pruebas. No se cambió código de backend para resolverlo.

No fue posible hacer una revisión visual: la herramienta de navegador falló al iniciar su entorno. DOM simulado y API real verifican funcionalidad, no equivalen a captura/píxeles, comportamiento nativo ni aceptación visual en móvil. Queda pendiente esa revisión por el equipo antes de fusionar el PR a main.

## Ejecutar

Backend: ver `backend/README.md`; usa .NET 8 y la misma base de desarrollo ya migrada. Frontend desde raíz:

```powershell
npm.cmd ci
npm.cmd run setup
# Configurar frontend/.env con VITE_API_BASE_URL si no existe .env.local.
npm.cmd run dev
```

App: http://localhost:5173. API/Swagger: http://localhost:5080/swagger. Todos los módulos se encuentran en la misma navegación. No hay que ejecutar otra aplicación Vite desde src/ ni reinstalar versiones diferentes de React para el prototipo original.

Pruebas desde raíz:

```powershell
npm.cmd test
npm.cmd run build
# Requiere API y SQL de desarrollo: crea sus propios datos.
npm.cmd run test:api
dotnet test tests/unitarios/Solvex.Api.Tests/Solvex.Api.Tests.csproj
# Definir SOLVEX_SQL_TEST_CONNECTION según backend/README.md:
dotnet test tests/integracion/Solvex.Api.SqlTests/Solvex.Api.SqlTests.csproj
```

No se actualizan estados de Jira. El merge de integración se publica en su propia rama; la revisión y aprobación del PR a main corresponden al equipo.
