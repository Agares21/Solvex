# Sprint 1 — Productos e inventario

Fecha de verificación: 23/10/2026. Épica SCRUM-5; alcance comprometido: SCRUM-11 (5 SP), SCRUM-12 (5 SP), SCRUM-13 (3 SP). No se alteraron estados de Jira ni se crearon ramas, commits, merges o push.

## Revisión y decisiones

Se reutilizó íntegramente la implementación de HU-01. El repositorio estaba en `main` con el README modificado y la implementación anterior aún sin seguimiento en Git. Se comprobaron las 15 pruebas xUnit originales y el recorrido HTTP de productos antes de ampliar el modelo. Se conservaron los PDFs, modelos C4 y carpetas anteriores.

Product no tenía existencias. Se añade un saldo único `Stock` y el historial `InventoryMovements`: ver [modelo entidad-relación y estrategia transaccional](modelo-entidad-relacion.md). El ajuste condicional se hace en SQL, no mediante una lectura y cálculo en memoria; se guarda el movimiento en la misma transacción.

Reglas iniciales adoptadas: unidades enteras positivas hasta 2147483647, motivo obligatorio de hasta 300 caracteres, fecha UTC asignada por servidor, stock inicial cero, movimientos solo sobre productos activos. Los inactivos conservan saldo e historial, pero no se consideran disponibles para atender pedidos. La respuesta de disponibilidad muestra sus existencias físicas y marca toda la solicitud como faltante utilizable si el producto está inactivo. Se rechazan productos repetidos y desconocidos en disponibilidad; se admiten entre 1 y 100 productos distintos. Estas reglas deben validarse con el cliente junto con los criterios propuestos.

## Registro de endpoints

| Método | Ruta | Contrato y códigos |
| --- | --- | --- |
| GET | `/api/products` | Catálogo, 200 |
| GET | `/api/products/{id}` | Detalle, 200/404 |
| POST | `/api/products` | ProductInput, 201/400/409 |
| PUT | `/api/products/{id}` | ProductInput, 200/400/404/409; no altera stock |
| PATCH | `/api/products/{id}/deactivate` | 204/404; conserva stock e historial |
| GET | `/api/inventory` | StockDto[], 200; incluye inactivos |
| GET | `/api/inventory/{productId}` | StockDto, 200/404 |
| GET | `/api/inventory/{productId}/movements` | MovementDto[], últimos 50 por fecha e ID descendentes; 200/404 |
| GET | `/api/inventory/movements/{id}` | MovementDto, 200/404 |
| POST | `/api/inventory/{productId}/movements` | MovementInput → AdjustmentDto, 201 y Location; 400/404/409 |
| POST | `/api/availability` | AvailabilityInput → AvailabilityDto, 200/400/404; solo consulta |

Todos pueden devolver 500 ProblemDetails sin detalles internos ante errores inesperados. Swagger incluye contratos, tipos de movimiento y descripciones de las nuevas operaciones. La interfaz se publica en `/swagger` y el documento en `/swagger/v1/swagger.json`, solo en Development.

Ejemplo de entrada (usar Exit para una salida):

```json
{"type":"Entry","quantity":10,"reason":"Conteo inicial"}
```

Devuelve `movement` con `id`, `productId`, `type`, `quantity`, `reason`, `registeredAt`, y `currentStock`. Un saldo insuficiente, un producto inactivo o el desbordamiento del saldo generan 409. Tipo inválido, cantidad ausente/no positiva/fraccionaria o motivo vacío generan 400.

Ejemplo de consulta de disponibilidad:

```json
{"items":[{"productId":1,"quantity":3},{"productId":2,"quantity":5}]}
```

Devuelve `allAvailable` y `items`: `productId`, `code`, `name`, `isActive`, `requestedQuantity`, `availableQuantity`, `isSufficient`, `missingQuantity`. Stock insuficiente es un resultado 200, no un error de la consulta. No se crea reserva, salida ni movimiento. El resultado es informativo y puede cambiar antes de registrar un pedido.

## Matriz de trazabilidad

| Requisito → historia → Jira | Código | Pruebas / evidencia |
| --- | --- | --- |
| RF-01 → HU-01 → SCRUM-11 | ProductsController, ProductService, ProductRepository; CatalogPage, ProductPage | 15 casos originales ProductServiceTests; products-smoke.mjs; edición de catálogo conserva stock en sprint1-smoke.mjs |
| RF-02 → HU-02 → SCRUM-12 | InventoryController → InventoryService → InventoryRepository → DbContext; InventoryPage | InventoryServiceTests: entrada, salida, datos inválidos, saldo negativo, historial, inexistentes e inactivos; sprint1-smoke.mjs: salidas y entradas concurrentes, saldos y movimientos coherentes, límite numérico; sprint1.test.tsx: formulario, refresco y conflicto |
| RF-06 → HU-06 → SCRUM-13 | AvailabilityController → IAvailabilityService/AvailabilityService → IInventoryRepository; AvailabilityPage | AvailabilityServiceTests: suficiente, insuficiente, faltantes, sin mutaciones, validación, duplicados, inexistentes e inactivos; sprint1-smoke.mjs: consulta múltiple sin cambios; sprint1.test.tsx: selección múltiple, resultado y errores |

## Resultados comprobados

- Compilación backend sin errores ni advertencias. **35 pruebas xUnit aprobadas** con .NET 8: 15 de productos y 20 de inventario/disponibilidad.
- Compilación TypeScript/Vite correcta. **10 pruebas frontend aprobadas**: seis del cliente HTTP y cuatro de componentes con DOM simulado. La instalación npm reportó cero vulnerabilidades.
- Migración aditiva aplicada en `SolvexHu01Demo` de SQL Express: tres productos antes y los mismos tres después, todos con stock inicial cero. No se recreó la base ni se eliminaron datos.
- Ambos recorridos HTTP aprobados contra API real y SQL Server. Dos salidas simultáneas de siete unidades sobre saldo diez producen exactamente un 201 y un 409, con saldo tres y dos movimientos totales (entrada y salida). Cinco entradas simultáneas posteriores dejan saldo ocho sin actualizaciones perdidas.
- Disponibilidad suficiente/insuficiente comprobada en una sola solicitud; el saldo y el historial permanecen iguales después. Los rechazos tampoco insertan movimientos. Probados límites de enteros, producto inactivo, validación de campos, Location y 404.
- Consulta directa SQL confirmó la igualdad entre cada saldo y su historial completo y la conservación de los tres productos anteriores. Los productos 5 y 6 generados por el recorrido de Sprint 1 quedan con saldos de demostración 8 (inactivo) y 3 (activo), respectivamente; los scripts pueden dejar más registros al repetirse.
- Swagger responde e incluye las ocho rutas de productos, inventario y disponibilidad. Las rutas React son servidas por Vite; esto no equivale a una revisión visual.

## Pendientes de aceptación y límites

Las tres historias tienen implementación y verificación automatizada de las reglas descritas. **No se declaran cerradas formalmente**: falta validar visualmente el recorrido responsive en navegador y obtener aceptación del cliente sobre criterios propuestos. No hubo navegador conectado en esta sesión; las pruebas de componentes no verifican diseño, píxeles o comportamiento nativo de un navegador.

Recorrido manual: en `/inventory`, buscar un producto activo, registrar entrada con motivo, registrar salida, comprobar saldo e historial; probar salida excesiva y campos inválidos. En `/availability`, seleccionar varios productos, comprobar suficientes/faltantes y confirmar en inventario que no cambió el saldo. Repetir a 390, 768 y 1440 px; verificar foco/teclado, menú, formularios y desplazamiento de tablas. Para productos seguir CP-01 en [trazabilidad HU-01](hu-01-trazabilidad.md).

El historial de API se limita a 50 registros recientes por producto, aunque conserva todos en SQL. No hay paginación de servidor del catálogo, reservas de pedidos, edición/eliminación de movimientos ni operaciones masivas de ajuste. Los reintentos manuales de un POST tras una respuesta de red incierta requieren comprobar el historial; todavía no hay claves de idempotencia. Las pruebas de concurrencia comprueban solicitudes simultáneas, no una prueba de carga exhaustiva.

JWT/RBAC, Redis, PWA, CI y otros módulos permanecen fuera del alcance. La edición simultánea de datos de catálogo sigue usando el último guardado; la seguridad del saldo de inventario usa UPDATE condicional y transacción. El cambio a React como único cliente continúa pendiente de incorporar formalmente al C2/ADRs.

## Archivos de esta ampliación

Modificados respecto al estado inicial de esta tarea:

```text
Readme.md
docs/arquitectura/decision-web-react.md
backend/Solvex.Api/Solvex.Api.csproj
backend/Solvex.Api/Program.cs
backend/Solvex.Api/Entities/Product.cs
backend/Solvex.Api/Data/SolvexDbContext.cs
backend/Solvex.Api/Data/Migrations/SolvexDbContextModelSnapshot.cs
backend/Solvex.Api/Infrastructure/ApiExceptionHandler.cs
frontend/package.json
frontend/package-lock.json
frontend/src/main.tsx
frontend/src/routes/App.tsx
frontend/src/components/Feedback.tsx
```

Nuevos:

```text
backend/Solvex.Api/Entities/InventoryMovement.cs
backend/Solvex.Api/DTOs/InventoryDtos.cs
backend/Solvex.Api/Repositories/InventoryRepository.cs
backend/Solvex.Api/Services/InventoryService.cs
backend/Solvex.Api/Services/AvailabilityService.cs
backend/Solvex.Api/Controllers/InventoryController.cs
backend/Solvex.Api/Controllers/AvailabilityController.cs
backend/Solvex.Api/Data/Migrations/20261023145149_AddInventory.cs
backend/Solvex.Api/Data/Migrations/20261023145149_AddInventory.Designer.cs
frontend/src/types/inventory.ts
frontend/src/services/inventory.ts
frontend/src/components/useStock.ts
frontend/src/pages/InventoryPage.tsx
frontend/src/pages/AvailabilityPage.tsx
frontend/src/pages/sprint1.test.tsx
frontend/src/styles/inventory.css
tests/unitarios/Solvex.Api.Tests/InventoryServiceTests.cs
tests/unitarios/Solvex.Api.Tests/AvailabilityServiceTests.cs
tests/integracion/sprint1-smoke.mjs
docs/modelo-entidad-relacion.md
docs/sprint1.md
```

Git todavía presenta la implementación previa como archivos nuevos; esta lista distingue la ampliación actual. Ramas sugeridas, sin crearlas: `feature/SCRUM-12-control-inventario` y `feature/SCRUM-13-disponibilidad-productos`. Commits sugeridos: `SCRUM-12 Implementar ajustes transaccionales de inventario`, `SCRUM-13 Implementar consulta de disponibilidad`, `SCRUM-12 SCRUM-13 Agregar pruebas y documentación`.
