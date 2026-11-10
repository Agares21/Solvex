# Migraciones SQL Server

Se utiliza el contexto existente `SolvexDbContext` y la misma cadena `ConnectionStrings:Solvex`. No hay migraciones automáticas al iniciar la API.

| Migración | Alcance |
| --- | --- |
| 20261023134232_InitialProducts | Products, código único y precio no negativo |
| 20261023145149_AddInventory | Stock inicial cero, InventoryMovements, restricciones y relación con productos |
| 20261110121023_Sprint2SuppliersAndPurchases | Suppliers, Purchases y PurchaseDetails; referencia opcional PurchaseDetailId en movimientos existentes; índices y restricciones |

La migración del Sprint 2 es aditiva: no cambia precios, saldos ni detalles de productos anteriores. Todos los movimientos anteriores mantienen PurchaseDetailId null. El índice único filtrado aplica solo cuando esa referencia está informada. Las relaciones usan `Restrict`, sin eliminaciones en cascada.

Restricciones nuevas: identificador de proveedor único; una línea por producto/compra; cantidades 1–1000000; costos no negativos; subtotal igual a cantidad × costo; total no negativo; estado Pending con ReceivedAt null o Received con fecha no nula; máximo un movimiento de recepción por detalle. importes: UnitCost decimal(10,2), Subtotal/Total decimal(18,2). El servicio calcula totales y exige 1–100 detalles.

Revisión y aplicación desde la raíz, con SDK/runtime 8 y conexión configurada por entorno o user-secrets:

```powershell
dotnet tool restore
New-Item -ItemType Directory -Force tmp | Out-Null
dotnet ef migrations list --project backend/Solvex.Api
dotnet ef migrations script --idempotent --project backend/Solvex.Api --output tmp/sprint2-migrations.sql
dotnet ef database update --project backend/Solvex.Api
```

Verificar destino antes del último comando. No ejecutar Down ni borrar/recrear bases. Para una base del Sprint 1, EF aplica solo la nueva migración; para una instalación inicial aplica las tres. Los métodos Down generados se conservan como metadatos EF, pero no fueron ejecutados.

Evidencia del 10/11/2026 en `.\SQLEXPRESS`, `SolvexHu01Demo`: antes de aplicar Sprint 2 había 9 productos y 13 movimientos; inmediatamente después seguían siendo 9 y 13. Luego las pruebas añadieron sus propios registros. No se modificaron otras bases ni se eliminaron datos. La aplicación real y las pruebas SQL verificaron posteriormente los nuevos modelos y la recepción.
