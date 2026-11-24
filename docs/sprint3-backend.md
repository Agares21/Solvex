# Sprint 3 — Backend

## Alcance implementado

- SCRUM-17 / HU-05: clientes, pedidos y detalles de pedido.
- SCRUM-43 / HU-07: solicitudes de maquetas vinculadas a cliente.
- SCRUM-45 / HU-08: precio acordado, anticipos/pagos, total pagado y saldo calculado.
- SCRUM-46 / HU-09: estados `Requested`, `InProgress` y `Completed` con transición hacia adelante.
- SCRUM-47 / HU-10: historial de pedidos y maquetas por cliente.

## Decisiones por información no especificada

La rama `origin/Tpg_front` contiene pantallas visuales de pedidos y maquetas, pero usa arrays en memoria, productos ficticios y no hace solicitudes HTTP. No incluye pantallas de pagos ni historial de clientes. Por ello, el backend usa IDs y relaciones persistidas, mientras que el contrato de adaptación está en [sprint3-contract.md](api/sprint3-contract.md).

No se descuenta ni reserva inventario al crear un pedido. El precio se captura en cada detalle desde `Product.Price` al registrar/editar el pedido, para conservar el importe histórico. El saldo de una maqueta no se duplica en tabla: se calcula desde `AgreedPrice` y `MockupPayments` dentro de la consulta.

La recepción de pagos usa transacción serializable para impedir que dos pagos concurrentes superen el saldo. Todas las relaciones usan `Restrict`; no hay eliminación en cascada.

## Migración

`20261124180808_Sprint3CustomersOrdersMockups` crea `Customers`, `Orders`, `OrderDetails`, `Mockups` y `MockupPayments`, además de restricciones, índices y precisiones monetarias. Fue generada, no aplicada. Revisar el script antes de aplicarlo en una base de desarrollo:

```powershell
dotnet tool restore
$env:DOTNET_ROLL_FORWARD='Major'
dotnet ef migrations script --project backend/Solvex.Api --output tmp/sprint3-migrations.sql
```

No ejecutar `database update` contra producción ni borrar/recrear bases.
