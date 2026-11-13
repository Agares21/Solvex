# Sprint 2 — Backend de Alejandro

Actualización de entrega: tras verificar el backend, el usuario autorizó crear commits y publicar `feature/sprint2-backend` con Conventional Commits (`chore`, `fix`, `feat`, `test`, `docs`). Los apartados que indican ausencia de commits describen el estado previo a esta autorización. Se conservan los cambios locales del frontend fuera de estos commits; no se autoriza ni realiza merge con main ni cambios en Jira.

Fecha: 10/11/2026. Rama: `feature/sprint2-backend`, creada con autorización expresa desde `Sprin1_Back`, conservando los cambios sin confirmar. Alcance exclusivo: las diez subtareas de backend, persistencia, pruebas y documentación de HU-03/HU-04. Sin commits, push, merges ni cambios en Jira.

## Resultado y verificación

Proveedores permite registrar, listar, buscar por nombre/identificador y consultar detalle. Compras permite registrar cabecera y detalles, calcular importes decimales, consultar y recibir una sola vez con entradas de inventario. El frontend no se implementó ni se modificó.

| Comprobación ejecutada | Resultado real |
| --- | --- |
| Regresión antes de modificar | 36 pruebas xUnit aprobadas |
| Compilación backend final | Correcta; cero errores y advertencias |
| Pruebas unitarias finales | 58 aprobadas: 36 previas, 8 proveedores, 14 compras |
| Pruebas xUnit SQL Server | 5 aprobadas, con runtime .NET 8.0.32 y SQL Express real |
| Recorridos HTTP | products-smoke.mjs, sprint1-smoke.mjs y sprint2-smoke.mjs aprobados |
| Swagger | Siete operaciones nuevas verificadas; estados string e importes number/decimal |
| Modelo/migración | `has-pending-model-changes`: sin cambios pendientes |
| Preservación SQL | 9 productos y 13 movimientos antes e inmediatamente después de migrar; los registros previos siguen presentes tras pruebas |
| Recepciones persistidas | Cero detalles con movimientos duplicados; cero compras Received sin sus entradas coincidentes |
| Frontend | 28 archivos de origen/configuración comparados por SHA-256 con el estado inicial, idénticos; sin archivos nuevos/eliminados por esta tarea |

Se guardaron resultados TRX locales en `tmp/sprint2-results/unitarios.trx` y `tmp/sprint2-results/sql.trx` (temporales, excluidos de Git). La [instantánea OpenAPI](api/sprint2-openapi.json) se obtuvo de la API ejecutada y contiene también los endpoints previos. El [contrato para Diana](api/sprint2-contract.md) explica cada operación nueva sin depender de la conversación.

## Trazabilidad de las diez subtareas

| Requisito / historia | Subtarea | Código y evidencia |
| --- | --- | --- |
| RF-03 → SCRUM-14 (HU-03) | SCRUM-48 | Supplier, configuración DbContext y Sprint2SuppliersAndPurchases; migración aplicada y datos previos preservados |
| RF-03 → SCRUM-14 | SCRUM-54 | ISupplierRepository/SupplierRepository y SupplierService; búsqueda parcial, normalización y unicidad |
| RF-03 → SCRUM-14 | SCRUM-49 | SuppliersController, SupplierInput/SupplierDto; GET lista/filtro, GET ID y POST; Swagger y HTTP comprobados |
| RF-03 → SCRUM-14 | SCRUM-53 | SupplierServiceTests (8 casos) y recorrido HTTP real de registro, validación, búsqueda, duplicidad y 404; contrato actualizado |
| RF-04 → SCRUM-16 (HU-04) | SCRUM-55 | Purchase, PurchaseDetail, PurchaseStatus, relaciones restrictivas y precisiones decimal; migración y modelo ER |
| RF-04 → SCRUM-16 | SCRUM-56 | IPurchaseRepository/PurchaseRepository, PurchaseService; registro atómico, consulta y cálculos; 14 casos de servicio |
| RF-04 → SCRUM-16 | SCRUM-57 | UPDATE condicionado Pending, transacción compartida con InventoryRepository, IPurchaseInventory, índice único PurchaseDetailId; concurrencia y rollback probados en SQL real |
| RF-04 → SCRUM-16 | SCRUM-58 | PurchasesController y DTOs; GET lista, GET ID, POST, POST receive; 200/201/400/404/409 y manejo genérico de 500 |
| RF-04 → SCRUM-16 | SCRUM-62 | PurchaseServiceTests y PurchaseSqlTests; 58 pruebas unitarias y cinco SQL aprobadas, incluidos Sprint 1 y recepción real |
| RF-04 → SCRUM-16 | SCRUM-63 | backend/README.md, contrato API, snapshot OpenAPI, modelo ER, migraciones y este informe con comandos/resultados |

Las implementaciones indicadas fueron verificadas dentro del alcance backend. No se modificó el estado de las tareas ni se declara terminada la integración visual de las historias: corresponde al frontend independiente y a la aceptación del equipo/cliente.

## Pruebas críticas de recepción

`RegisterAndReceive_PersistsDetailsAndStockExactlyOnce`: guarda dos detalles y total 9.90; crear no cambia stock; recibir agrega tres y dos unidades; el segundo intento produce conflicto y conserva exactamente dos movimientos.

`ConcurrentConfirmations_OnlyOneReceives`: usa dos DbContext/conexiones independientes y libera ambas operaciones a la vez. Exactamente una recibe; la otra devuelve PurchaseConflictException. Saldo y número de movimientos se verifican con un tercer contexto.

`FailureOnSecondProduct_RollsBackEarlierStockMovementAndStatus`: registra la compra, desactiva el segundo producto de prueba y recibe. Falla después de la primera entrada; al consultar con otro contexto, la compra sigue Pending, ReceivedAt sigue null, el primer saldo sigue cero y no hay movimientos de recepción. Tras reactivar el producto, la misma compra puede recibirse correctamente.

`InvalidDetail_SaveChangesRollsBackHeaderAndOtherDetails`: fuerza un detalle inválido directamente en el repositorio para comprobar la restricción SQL y la transacción de SaveChanges. Ni cabecera ni detalles quedan guardados. Esto comprueba rollback real, no simulado.

`MissingPurchase_ReceiveReturnsNotFound`: intenta recibir un ID inexistente y obtiene PurchaseNotFoundException.

El recorrido HTTP además valida contratos, búsqueda SQL, Location, errores de validación, datos inexistentes, costos, cálculos, estados, recepción concurrente y recuperación después del fallo. Las pruebas crean registros propios con claves únicas y los conservan; no modifican datos anteriores ni eliminan bases. No son una prueba exhaustiva de carga.

## Concurrencia y fuente de stock

PurchaseRepository abre una transacción y ejecuta `UPDATE Purchases ... WHERE Id = id AND Status = Pending`, actualizando estado y ReceivedAt juntos. El bloqueo SQL sobre esa fila se mantiene hasta commit/rollback. Otro receptor espera: tras el commit ve cero filas afectadas y responde 409. Si el primero falla y revierte, el estado vuelve a Pending y se puede intentar nuevamente.

InventoryRepository reutiliza la transacción actual; solo abre/compromete una propia para ajustes manuales fuera de recepción. Se conserva el UPDATE condicional de saldo y el control de producto activo/desbordamiento del Sprint 1. Los detalles se procesan por ProductId para reducir el riesgo de ciclos de bloqueo entre compras distintas. Una excepción revierte todas las entradas y el estado de recepción.

Cada entrada enlaza con PurchaseDetailId. El índice único filtrado impide duplicar una línea recibida sin restringir movimientos manuales con referencia null. `Products.Stock` sigue siendo el único saldo; ni compras ni detalles son una segunda existencia. El contrato previo de inventario y disponibilidad no cambia. No hay cambios destructivos de esquema.

## Decisiones no especificadas en el SRS

- Proveedor: identificador interno de negocio único (40), nombre (150), contacto opcional (150), teléfono (40), correo (254), dirección (300); al menos un teléfono/correo válido. Identifier no presupone NIT ni un formato fiscal.
- Compras en Bs; costos no negativos con dos decimales. Cantidades enteras 1–1000000, máximo 100 líneas sin repetir productos. Los productos deben estar activos al registrar y al recibir. Fechas UTC generadas por servidor.
- Estado inicial Pending y recepción completa única Received. No hay recepción parcial, cancelación, edición, eliminación, descuentos, impuestos, facturas ni pagos.
- UnitCost decimal(10,2); Subtotal/Total decimal(18,2). Los nombres devueltos provienen de los registros actuales, no de copias históricas. Cantidades/costos del detalle permanecen almacenados.
- Listas sin paginación de servidor. La comparación de búsqueda/identificadores depende de la collation SQL configurada; la API normaliza identificador a mayúsculas.

Estas reglas deben validarse con el cliente, sin alterar el SRS o ADR originales como si ya estuvieran aprobadas.

## Ejecución

Los pasos completos están en [backend/README.md](../backend/README.md). Desde la raíz, con runtime/SDK 8 y conexión de desarrollo configurada:

```powershell
dotnet restore backend/Solvex.Api/Solvex.Api.csproj
dotnet tool restore
dotnet ef database update --project backend/Solvex.Api
dotnet run --project backend/Solvex.Api --launch-profile http
```

En otra terminal:

```powershell
dotnet test tests/unitarios/Solvex.Api.Tests/Solvex.Api.Tests.csproj
$env:SOLVEX_SQL_TEST_CONNECTION='Server=.\SQLEXPRESS;Database=SolvexHu01Demo;Integrated Security=True;TrustServerCertificate=True'
dotnet test tests/integracion/Solvex.Api.SqlTests/Solvex.Api.SqlTests.csproj
$env:SOLVEX_TEST_API_URL='http://localhost:5080/api'
node tests/integracion/sprint2-smoke.mjs
```

## Archivos de esta tarea

Modificados sobre el estado encontrado, conservando sus cambios previos:

```text
Readme.md
backend/.env.example
backend/Solvex.Api/Program.cs
backend/Solvex.Api/Data/SolvexDbContext.cs
backend/Solvex.Api/Data/Migrations/SolvexDbContextModelSnapshot.cs
backend/Solvex.Api/Entities/InventoryMovement.cs
backend/Solvex.Api/Infrastructure/ApiExceptionHandler.cs
backend/Solvex.Api/Repositories/InventoryRepository.cs
docs/modelo-entidad-relacion.md
```

Nuevos:

```text
backend/README.md
backend/Solvex.Api/Entities/Supplier.cs
backend/Solvex.Api/Entities/Purchase.cs
backend/Solvex.Api/DTOs/SupplierDtos.cs
backend/Solvex.Api/DTOs/PurchaseDtos.cs
backend/Solvex.Api/Repositories/SupplierRepository.cs
backend/Solvex.Api/Repositories/PurchaseRepository.cs
backend/Solvex.Api/Services/SupplierService.cs
backend/Solvex.Api/Services/PurchaseService.cs
backend/Solvex.Api/Controllers/SuppliersController.cs
backend/Solvex.Api/Controllers/PurchasesController.cs
backend/Solvex.Api/Data/Migrations/20261110121023_Sprint2SuppliersAndPurchases.cs
backend/Solvex.Api/Data/Migrations/20261110121023_Sprint2SuppliersAndPurchases.Designer.cs
tests/unitarios/Solvex.Api.Tests/SupplierServiceTests.cs
tests/unitarios/Solvex.Api.Tests/PurchaseServiceTests.cs
tests/integracion/Solvex.Api.SqlTests/Solvex.Api.SqlTests.csproj
tests/integracion/Solvex.Api.SqlTests/PurchaseSqlTests.cs
tests/integracion/sprint2-smoke.mjs
docs/api/sprint2-contract.md
docs/api/sprint2-openapi.json
docs/migrations.md
docs/sprint2-backend.md
```

Git ya mostraba cambios de ProductsController, ProductService, README y archivos React, además de archivos sin seguimiento del Sprint 1. No se revirtieron ni se incluyeron en ningún commit. La rama nueva los hereda en el working tree. Para preparar commits del Sprint 2, seleccionar solo archivos/hunks propios de backend, pruebas y documentación; no añadir frontend ni usar `git add .` indiscriminadamente.

## Commits sugeridos, sin ejecutar

- `SCRUM-48 SCRUM-55 Agregar persistencia de proveedores y compras`
- `SCRUM-54 SCRUM-49 Implementar servicio y API de proveedores`
- `SCRUM-56 SCRUM-57 SCRUM-58 Implementar compras y recepción transaccional`
- `SCRUM-53 SCRUM-62 Agregar pruebas de proveedores y compras`
- `SCRUM-63 Documentar contrato API, migraciones y evidencias`

La migración agrupa proveedores y compras por sus relaciones: no dividirla en commits que dejen el modelo sin compilar.

## Pendientes y límites

Integración de Diana y aceptación funcional del cliente; autenticación/RBAC y despliegue seguro; CI y pruebas de carga. No se añadieron nuevas tecnologías de infraestructura. Los POST de alta no tienen clave de idempotencia: una respuesta de red incierta requiere consultar antes de repetir. Recibir una compra sí evita aplicar stock dos veces, pero un reintento exitoso anterior responde 409. No se habilitó frontend, Flutter, PWA, caché ni sincronización offline.
