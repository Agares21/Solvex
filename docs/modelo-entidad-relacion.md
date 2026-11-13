# Modelo entidad-relación — Sprints 1 y 2

```mermaid
erDiagram
    Products ||--o{ InventoryMovements : registra
    Products {
        int Id PK
        nvarchar40 Code UK
        nvarchar150 Name
        nvarchar1000 Description "opcional"
        decimal10_2 Price
        bit IsActive
        int Stock "saldo actual, inicial 0, >= 0"
    }
    InventoryMovements {
        bigint Id PK
        int ProductId FK
        nvarchar10 Type "Entry o Exit"
        int Quantity "> 0"
        nvarchar300 Reason
        datetimeoffset RegisteredAt "UTC"
        int PurchaseDetailId FK "opcional; único si no es null"
    }
    Suppliers ||--o{ Purchases : abastece
    Purchases ||--|{ PurchaseDetails : contiene
    Products ||--o{ PurchaseDetails : comprado
    PurchaseDetails o|--o| InventoryMovements : recepcion
    Suppliers {
        int Id PK
        nvarchar40 Identifier UK
        nvarchar150 Name
        nvarchar150 ContactName "opcional"
        nvarchar40 Phone "opcional; teléfono o correo obligatorio en API"
        nvarchar254 Email "opcional"
        nvarchar300 Address "opcional"
    }
    Purchases {
        int Id PK
        int SupplierId FK
        datetimeoffset RegisteredAt "UTC"
        datetimeoffset ReceivedAt "opcional; obligatorio si Received"
        nvarchar10 Status "Pending o Received"
        decimal18_2 Total
    }
    PurchaseDetails {
        int Id PK
        int PurchaseId FK
        int ProductId FK
        int Quantity "1 a 1000000"
        decimal10_2 UnitCost
        decimal18_2 Subtotal
    }
```

`Products.Stock` es el único saldo actual. Cada movimiento registra una variación positiva y su sentido; no almacena otra copia del saldo. Desde el saldo inicial cero debe cumplirse `Stock = SUM(Entry.Quantity) - SUM(Exit.Quantity)`. La edición de catálogo no admite Stock en sus DTOs.

Un ajuste ejecuta un UPDATE condicional del saldo y un INSERT del movimiento dentro de la misma transacción SQL. La salida exige `Stock >= Quantity`; la entrada comprueba que no exceda Int32.MaxValue. Los bloqueos de actualización SQL serializan ajustes concurrentes sobre el mismo producto. Si falla el INSERT o el commit, se revierte la transacción. Un movimiento rechazado no deja cambios parciales.

Restricciones: stock no negativo; cantidad positiva; tipo Entry/Exit; código de producto único; relación con eliminación restringida. Índice de movimientos `(ProductId, RegisteredAt, Id)` para consulta de los últimos 50. No hay endpoints para editar o borrar movimientos. Una corrección se registra como un nuevo ajuste con motivo.

Migraciones: `InitialProducts` original y `AddInventory` aditiva. La segunda añade una columna con valor inicial cero, una tabla, sus restricciones e índice. Conserva los productos existentes y no intenta inferir existencias físicas: el personal debe registrar el conteo inicial como entrada. No se ejecutaron operaciones Down.

Sprint 2 añade proveedores, compras y detalles con `Sprint2SuppliersAndPurchases`: ver [migraciones](migrations.md). Crear compra guarda cabecera y detalles en la transacción automática de SaveChanges y no cambia stock. Recibir compra reclama el estado Pending con un UPDATE condicionado, luego reutiliza InventoryRepository dentro de esa misma transacción; cualquier fallo revierte estado, fecha, saldos y movimientos.

`InventoryMovements.PurchaseDetailId` nullable identifica movimientos de recepción. Un índice único filtrado impide dos movimientos por detalle, sin afectar ajustes manuales que dejan esa referencia null. Los detalles no duplican saldo: almacenan cantidades compradas y costos, mientras que `Products.Stock` sigue siendo la única existencia actual. La API no expone edición/eliminación de compras ni movimientos.
