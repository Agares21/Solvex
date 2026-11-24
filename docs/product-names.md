# Nombres únicos de productos — 13/11/2026

Registrar y editar productos exige un nombre único, incluso si el registro anterior está inactivo. Se ignoran mayúsculas/minúsculas y espacios normales al principio/final: `Cartapacio`, `cartapacio` y ` Cartapacio ` son el mismo nombre. Los acentos sí distinguen nombres; no se colapsan espacios interiores ni se comparan palabras parcialmente. Variantes como `Cartapacio tamaño carta` y `Cartapacio tamaño oficio` son distintas.

El servicio consulta el nombre excluyendo el propio Id al editar y devuelve HTTP 409 con `Ya existe un producto con ese nombre.`. El formulario muestra el error conservando los campos para corregirlos. Mantener el nombre del mismo producto al editar precio/descripción es válido.

SQL Server es la garantía final frente a escrituras directas y concurrencia: columna calculada persistida `NormalizedName` = `UPPER(LTRIM(RTRIM([Name]))) COLLATE Latin1_General_100_CI_AS` e índice único `IX_Products_NormalizedName`. Es una propiedad shadow de EF, no un campo de entrada/salida de la API. La collation explícita ignora diferencias de caso y conserva diferencias de acentos. Un conflicto del índice también se traduce a HTTP 409 con el mensaje de nombre duplicado.

## Migración y datos previos

`20261113173508_UniqueProductNames` añade columna e índice, sin eliminar productos ni tocar existencias. La migración aborta con un mensaje si hay duplicados; no los renombra automáticamente.

Antes de migrar una base con duplicados, respaldar y revisar `scripts/sql/prepare-unique-product-names.sql`. El script conserva el primer registro por Id y distingue los posteriores con `(código X)`, sin inventar características ni fusionar datos. Se ejecuta dentro de una transacción y comprueba que precios, códigos, stock, estados, compras, detalles y movimientos permanezcan iguales. Una colisión de los nombres resultantes revierte los cambios para revisión manual.

```powershell
# Solo contra la base revisada y respaldada:
sqlcmd -S '.\SQLEXPRESS' -E -C -d SolvexHu01Demo -b -f 65001 -i scripts/sql/prepare-unique-product-names.sql
dotnet ef database update --project backend/Solvex.Api
```

En la base local se detectaron dos pares. Se conservaron los productos originales y se renombraron únicamente:

- Id 8: `cartapacio` → `cartapacio (código 213)`.
- Id 4: `Cuaderno` → `Cuaderno (código 21321)`.

Se guardó una copia local previa de los 53 productos en `tmp/productos-antes-nombre-unico.json`, excluida de Git. El script comprobó la conservación de los datos relacionados antes del commit. Las pruebas SQL de regresión añadieron posteriormente sus registros propios con nombres únicos; los casos nuevos de nombre duplicado usan transacciones sin commit y no dejan productos.

## Verificación ejecutada

- Compilación backend y frontend correctas.
- 64 pruebas unitarias backend aprobadas: incluye alta duplicada, diferencias de caso/espacios, edición con nombre ajeno, conservación del propio e inactivos.
- 8 pruebas SQL aprobadas: las cinco anteriores de compras y tres nuevas que prueban la restricción con escrituras directas, incluida edición y producto inactivo.
- 18 pruebas frontend aprobadas: incluye mensaje del conflicto y conservación/corrección del formulario.
- HTTP real: alta con las tres variantes de Cartapacio y edición al nombre de otro producto devuelven 409. El registro rechazado conserva su nombre y no se crea ningún producto con los códigos de comprobación.
- Consulta SQL final: cero nombres duplicados; modelo EF sin cambios pendientes de migración.

Las pruebas SQL/compras y recorridos existentes ahora generan nombres únicos para poder repetirse con la restricción. Los recorridos HTTP completos de sprints anteriores no se volvieron a ejecutar en esta tarea para no añadir más datos al catálogo de demostración; sí se ejecutaron las pruebas SQL y la comprobación HTTP específica de duplicados. No se crearon commits ni se publicaron estos cambios automáticamente.
