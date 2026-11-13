# Contrato API Sprint 2 para Diana

Fecha: 10/11/2026. Backend ASP.NET Core 8. Base local: `http://localhost:5080/api`.
OpenAPI: `http://localhost:5080/swagger/v1/swagger.json`; interfaz: `/swagger` (solo Development).
JSON usa camelCase; fechas ISO 8601 en UTC; IDs enteros positivos; estados como cadenas `Pending` y `Received`. Importes JSON numéricos, tratados como `decimal` en C# y SQL, sin flotantes para los cálculos monetarios. Los ejemplos ilustran la forma del contrato; IDs y fechas reales los genera el servidor.

El frontend se integra mediante su cliente HTTP existente y URL de entorno. No se modificó ningún archivo React en este Sprint. CORS permite los orígenes configurados en `Cors:AllowedOrigins`, sin comodín ni credenciales. JWT/RBAC sigue diferido: API de desarrollo local.

## DTOs de proveedores

`SupplierInput`:

| Campo | Tipo | Regla |
| --- | --- | --- |
| identifier | string | Obligatorio, no vacío; máximo 40; se recorta y convierte a mayúsculas; único |
| name | string | Obligatorio, no vacío; máximo 150; se recorta |
| contactName | string o null | Opcional; máximo 150 |
| phone | string o null | Opcional; máximo 40; formato de teléfono validado por DataAnnotations |
| email | string o null | Opcional; máximo 254; formato de correo válido |
| address | string o null | Opcional; máximo 300 |

Se exige al menos phone o email. En campos opcionales no usados, omitir o enviar null; no enviar un correo o teléfono vacío/inválido. Identificador es un código de proveedor decidido para esta implementación, no necesariamente un NIT. El SRS no fijó diccionario de campos: estas reglas de contacto son decisiones a validar con el cliente.

`SupplierDto` contiene exactamente `id`, `identifier`, `name`, `contactName`, `phone`, `email`, `address`. No incluye estado activo ni fechas ni compras.

### GET /api/suppliers

Lista todos los proveedores ordenados por nombre e ID. Filtro opcional `search` de hasta 150 caracteres, recortado; coincidencia parcial en name o identifier. La sensibilidad a acentos/mayúsculas depende de la collation SQL Server. Sin paginación. Sin cuerpo.

Ejemplo: `GET /api/suppliers?search=Norte`.

200:

```json
[
  {"id":1,"identifier":"PROV-001","name":"Distribuidora Norte","contactName":"Ana","phone":"+591 77777777","email":"contacto@example.com","address":"La Paz"}
]
```

Sin coincidencias: `[]` (200). Búsqueda demasiado larga: 400. Fallo inesperado: 500.

### GET /api/suppliers/{id}

Consulta por ID interno. Sin cuerpo. 200:

```json
{"id":1,"identifier":"PROV-001","name":"Distribuidora Norte","contactName":"Ana","phone":"+591 77777777","email":"contacto@example.com","address":"La Paz"}
```

404: `El proveedor no existe.`. Fallo inesperado: 500.

### POST /api/suppliers

Entrada SupplierInput, `Content-Type: application/json`:

```json
{"identifier":"prov-001","name":"Distribuidora Norte","contactName":"Ana","phone":"+591 77777777","email":"contacto@example.com","address":"La Paz"}
```

201 y cabecera `Location: http://localhost:5080/api/suppliers/1`:

```json
{"id":1,"identifier":"PROV-001","name":"Distribuidora Norte","contactName":"Ana","phone":"+591 77777777","email":"contacto@example.com","address":"La Paz"}
```

400: campos inválidos o `Registra al menos un teléfono o correo de contacto.`. 409: `Ya existe un proveedor con ese identificador.`. Si la duplicidad ocurre concurrentemente, la restricción SQL puede devolver el mensaje genérico de conflicto descrito al final. 500: error interno. No existen endpoints de edición/desactivación/eliminación de proveedores en este alcance.

## DTOs de compras

`PurchaseInput` contiene solo:

| Campo | Tipo | Regla |
| --- | --- | --- |
| supplierId | integer | Positivo y existente |
| details | array de PurchaseDetailInput | Obligatorio; 1 a 100 líneas; sin productos repetidos ni líneas null |

`PurchaseDetailInput`:

| Campo | Tipo | Regla |
| --- | --- | --- |
| productId | integer | Positivo; producto existente y activo |
| quantity | integer | Obligatorio; entre 1 y 1000000 |
| unitCost | number decimal | Obligatorio; entre 0 y 99999999.99; hasta dos decimales |

El servidor calcula `subtotal = quantity * unitCost` y `total = SUM(subtotal)`; no enviar totales, fechas ni estado. Costos e importes se interpretan en Bs. El costo cero es válido. El total máximo es 9999999999999999.99. Los nombres de proveedor/producto son los actuales consultados; no son una copia histórica congelada. No hay facturación, pagos ni impuestos en este alcance.

`PurchaseSummaryDto`: `id`, `supplierId`, `supplierName`, `registeredAt`, `status`, `receivedAt`, `total`.

`PurchaseDto`: los siete campos anteriores y `details`, un array de `PurchaseDetailDto` con `id`, `productId`, `productCode`, `productName`, `quantity`, `unitCost`, `subtotal`.

### GET /api/purchases

Lista resúmenes ordenados por ID descendente. Sin filtros ni paginación ni cuerpo. **No devuelve details**. 200:

```json
[
  {"id":1,"supplierId":1,"supplierName":"Distribuidora Norte","registeredAt":"2026-11-10T12:00:00+00:00","status":"Pending","receivedAt":null,"total":9.90}
]
```

Lista vacía: `[]` (200). Fallo inesperado: 500.

### GET /api/purchases/{id}

Consulta una compra completa. Sin cuerpo. 200:

```json
{
  "id":1,"supplierId":1,"supplierName":"Distribuidora Norte",
  "registeredAt":"2026-11-10T12:00:00+00:00","status":"Pending","receivedAt":null,"total":9.90,
  "details":[
    {"id":1,"productId":1,"productCode":"CUA-001","productName":"Cuaderno","quantity":3,"unitCost":2.50,"subtotal":7.50},
    {"id":2,"productId":2,"productCode":"LAP-001","productName":"Lápiz","quantity":2,"unitCost":1.20,"subtotal":2.40}
  ]
}
```

404: `La compra no existe.`. Fallo inesperado: 500.

### POST /api/purchases

Registra cabecera y detalles atómicamente, estado inicial Pending; **no cambia stock**. Entrada PurchaseInput:

```json
{"supplierId":1,"details":[{"productId":1,"quantity":3,"unitCost":2.50},{"productId":2,"quantity":2,"unitCost":1.20}]}
```

201 y Location `/api/purchases/1` (URL absoluta en la respuesta real):

```json
{
  "id":1,"supplierId":1,"supplierName":"Distribuidora Norte",
  "registeredAt":"2026-11-10T12:00:00+00:00","status":"Pending","receivedAt":null,"total":9.90,
  "details":[
    {"id":1,"productId":1,"productCode":"CUA-001","productName":"Cuaderno","quantity":3,"unitCost":2.50,"subtotal":7.50},
    {"id":2,"productId":2,"productCode":"LAP-001","productName":"Lápiz","quantity":2,"unitCost":1.20,"subtotal":2.40}
  ]
}
```

400: DTO inválido, `El costo admite como máximo dos decimales.`, `Selecciona cada producto una sola vez por compra.`, `Los detalles no pueden ser nulos.` o importe máximo excedido. 404: `El proveedor no existe.` o `El producto no existe.`. 409: `No se pueden registrar compras con productos inactivos.`. 500: error interno. Una validación fallida no crea compra ni detalles.

### POST /api/purchases/{id}/receive

Recibe **toda** la compra. **Sin cuerpo**; no enviar details ni cantidades ni total. 200, PurchaseDto:

```json
{
  "id":1,"supplierId":1,"supplierName":"Distribuidora Norte",
  "registeredAt":"2026-11-10T12:00:00+00:00","status":"Received","receivedAt":"2026-11-10T12:05:00+00:00","total":9.90,
  "details":[
    {"id":1,"productId":1,"productCode":"CUA-001","productName":"Cuaderno","quantity":3,"unitCost":2.50,"subtotal":7.50},
    {"id":2,"productId":2,"productCode":"LAP-001","productName":"Lápiz","quantity":2,"unitCost":1.20,"subtotal":2.40}
  ]
}
```

404: `La compra no existe.`. 409: `La compra ya fue recibida.`, `No se permiten movimientos sobre productos inactivos.` o `La entrada supera el límite de existencias permitido.`. 500: error inesperado.

Reglas para la pantalla: deshabilitar Recepcionar si status es Received, bloquear el botón mientras guarda y refrescar compra e inventario tras éxito. Un segundo POST devuelve 409, nunca duplica stock. Si hay timeout, consultar GET antes de reintentar. Si el producto fue desactivado después de registrar la compra, recibir falla sin cambios: corregir la causa y reintentar. No hay recepción parcial ni edición/cancelación/eliminación de compras ni reversión de recepción.

## Errores comunes

Los errores usan `application/problem+json`. Los errores de negocio tienen `title`, `status`, `type` y `traceId` (valor dinámico):

```json
{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.10","title":"La compra ya fue recibida.","status":409,"traceId":"identificador-de-la-solicitud"}
```

La validación automática de ASP.NET puede incluir `errors` con nombres de propiedad y listas de mensajes; el texto y las claves dependen del validador y del idioma del runtime:

```json
{"title":"One or more validation errors occurred.","status":400,"errors":{"Identifier":["The Identifier field is required."]},"traceId":"identificador-de-la-solicitud"}
```

El cliente debe mostrar `errors` si existen y, en su defecto, `title`; no inferir lógica a partir de textos exactos ni de type/traceId. Un conflicto de índice único detectado en SQL devuelve 409 con `El registro entra en conflicto con un identificador o recepción existente.`. Un error interno devuelve 500 con `No se pudo completar la operación. Inténtalo nuevamente.`; la causa se registra solo en backend. JSON malformado o tipos incorrectos generan 400; rutas o métodos inexistentes pueden generar 404/405. No se devuelve stack trace al cliente.

## Garantías de recepción

Una sola transacción SQL reclama la compra por `Status = Pending`, actualiza saldo y guarda movimientos. La actualización condicional bloquea la fila de compra; el segundo receptor espera y luego obtiene 409. El repositorio de inventario participa en esa misma transacción, sin iniciar una transacción anidada. Si falla una línea se revierten todas, incluido ReceivedAt. Ordenar líneas por ProductId reduce ciclos de bloqueo entre compras distintas. Índice único filtrado en `InventoryMovements.PurchaseDetailId` garantiza como máximo un movimiento por detalle. El saldo sigue siendo únicamente `Products.Stock`.

No hay claves de idempotencia para el alta de compras/proveedores; ante respuestas inciertas consultar antes de repetir el alta. La recepción sí protege la aplicación única de sus efectos mediante estado e índice, aunque un reintento devuelve 409. Este contrato no promete trabajo offline ni reservas de stock.
