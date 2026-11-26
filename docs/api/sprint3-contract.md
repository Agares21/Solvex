# Contrato API — Sprint 3

Este contrato cubre HU-05, HU-07, HU-08, HU-09 y HU-10. Las respuestas usan JSON camelCase y los errores usan `application/problem+json` con `title`, `status` y `traceId`.

## Clientes

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/customers` | Lista clientes |
| GET | `/api/customers/{id}` | Cliente o 404 |
| POST | `/api/customers` | 201 y `Location` |
| PUT | `/api/customers/{id}` | Cliente actualizado o 404 |
| GET | `/api/customers/{id}/history` | Pedidos y maquetas solo de ese cliente |

Entrada de alta/edición:

```json
{"name":"María López","phone":"70000000","email":"maria@example.com"}
```

`name` es obligatorio (150). Teléfono y correo son opcionales. El historial incluye `customer`, `orders` y `mockups`; cada maqueta contiene `totalPaid` y `pendingBalance`, calculados desde sus pagos.

## Pedidos

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/orders` | Resúmenes, más reciente primero |
| GET | `/api/orders/{id}` | Detalle o 404 |
| POST | `/api/orders` | 201 y detalle |
| PUT | `/api/orders/{id}` | 200 y detalle actualizado |

```json
{
  "customerId": 1,
  "observations": "Entrega por la tarde",
  "details": [{"productId": 3,"quantity": 2}]
}
```

El servidor verifica cliente y productos, calcula `unitPrice`, `subtotal` y `total` desde los productos persistidos y no reserva ni descuenta stock. No se permiten cantidades fuera de 1–1000000 ni productos repetidos. El estado inicial es `Pending`; los valores disponibles para representación son `Pending`, `InProgress` y `Delivered`.

## Maquetas, anticipos y saldo

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/mockups` | Resúmenes con saldo calculado |
| GET | `/api/mockups/{id}` | Detalle y pagos o 404 |
| POST | `/api/mockups` | 201 y detalle |
| POST | `/api/mockups/{id}/payments` | Registra anticipo/pago, 200 |
| PUT | `/api/mockups/{id}/status` | Cambia estado, 200 |

Alta de una maqueta:

```json
{
  "customerId": 1,
  "institution": "Colegio San Calixto",
  "type": "Educativa",
  "size": "Mediana",
  "deliveryAt": "2026-12-02T15:00:00-04:00",
  "observations": "Sistema solar",
  "agreedPrice": 200.00
}
```

Pago:

```json
{"amount":75.00,"note":"Anticipo"}
```

Estado:

```json
{"status":"InProgress"}
```

El precio acordado y los pagos usan `decimal(10,2)`. Los pagos deben ser mayores que cero, de máximo dos decimales y no pueden superar el saldo pendiente. `pendingBalance` no se persiste: es `agreedPrice - sum(payments.amount)`. Estados definidos (HU-09): `Requested` (pendiente), `InProgress` (en proceso), `Completed` (terminada), `Delivered` (entregada) y `Cancelled` (cancelada). Transiciones permitidas: `Requested → InProgress | Cancelled`, `InProgress → Completed | Cancelled` y `Completed → Delivered`; `Delivered` y `Cancelled` son finales. Cualquier otra transición devuelve 409 sin cambiar el registro; un valor no definido devuelve 400. Cada cambio actualiza `statusUpdatedAt`.

## Integración pendiente del frontend existente

Los componentes actuales de `Tpg_front` usan estado local y datos de demostración; todavía no realizan HTTP. Para integrarlos sin alterar reglas del servidor deben:

1. Crear/seleccionar un cliente y enviar `customerId`, no solo el texto `cliente`.
2. Consultar `/api/products` para poblar productos en lugar de `productosDisponibles` fijo.
3. Enviar `details` y no `productos`; el total y precios de respuesta son autoridad del servidor.
4. Enviar `deliveryAt` ISO-8601 uniendo `fechaEntrega` y `horaEntrega`.
5. Enviar `agreedPrice`, requerido para anticipos y saldo.
6. Convertir estados visuales: `Requested/ InProgress/ Completed/ Delivered/ Cancelled` a las etiquetas `Pendiente/En proceso/Terminada/Entregada/Cancelada` (implementado en `frontend/src/pages/maquetasFormato.js`).

Los códigos visuales `PED-001` y `MAQ-001` no son claves de API: la API devuelve `id` entero; la interfaz puede formatearlo para presentación.
