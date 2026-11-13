# SOLVEX Backend — Sprint 2

ASP.NET Core 8, EF Core 8, SQL Server, Swagger y xUnit. Controllers → Services → Repositories → DbContext. Proveedores y compras amplían los módulos de productos/inventario/disponibilidad del Sprint 1. No se modifica React.

## Ejecutar

Requisitos: SDK .NET 8 y runtime ASP.NET Core 8, SQL Server/Express, Node solo para los recorridos HTTP opcionales. Desde la raíz del repositorio, PowerShell:

```powershell
dotnet restore backend/Solvex.Api/Solvex.Api.csproj
dotnet tool restore
$env:ConnectionStrings__Solvex='Server=.\SQLEXPRESS;Database=SolvexHu01Demo;Integrated Security=True;TrustServerCertificate=True'
dotnet ef migrations script --idempotent --project backend/Solvex.Api --output tmp/sprint2-migrations.sql
# Revisar script y base de destino antes de aplicar. Conservar la base existente del Sprint 1.
dotnet ef database update --project backend/Solvex.Api
dotnet run --project backend/Solvex.Api --launch-profile http
```

Crear `tmp` si no existe antes de generar el script. No ejecutar migraciones Down, drop, reset ni recrear la base. La API no aplica migraciones automáticamente. La cadena es un ejemplo de desarrollo Windows; `TrustServerCertificate=True` no es configuración de producción. Alternativa persistente para desarrollo: `dotnet user-secrets set "ConnectionStrings:Solvex" '<cadena>' --project backend/Solvex.Api`. ASP.NET no carga `.env` automáticamente; `backend/.env.example` es una referencia de nombres, no un archivo de configuración activo.

El perfil http publica `http://localhost:5080` en Development y permite `http://localhost:5173` en CORS. Para otros orígenes definir `Cors__AllowedOrigins__0`, `Cors__AllowedOrigins__1`, etc. Configurar HTTPS y autenticación antes de exponerlo fuera de desarrollo local. Swagger UI: `/swagger`; JSON: `/swagger/v1/swagger.json`.

En este equipo se dispone también del runtime 8 aislado descargado en tareas anteriores; si el sistema solo tiene runtime 10, después de compilar se puede iniciar así desde la raíz:

```powershell
$env:ConnectionStrings__Solvex='Server=.\SQLEXPRESS;Database=SolvexHu01Demo;Integrated Security=True;TrustServerCertificate=True'
$env:Cors__AllowedOrigins__0='http://localhost:5173'
$env:Cors__AllowedOrigins__1='http://127.0.0.1:5173'
$env:ASPNETCORE_ENVIRONMENT='Development'
$env:ASPNETCORE_URLS='http://localhost:5080'
./tmp/dotnet/dotnet.exe backend/Solvex.Api/bin/Debug/net8.0/Solvex.Api.dll
```

`tmp/dotnet` no se distribuye con Git: en otra máquina instalar .NET 8. Para ejecutar EF con el SDK 10 disponible aquí, se usó temporalmente `DOTNET_ROLL_FORWARD=Major`; la API y las pruebas se ejecutaron con runtime 8. No confundir versión del SDK con runtime. Si el puerto 5080 está ocupado por la API anterior, detenerla antes de iniciar una segunda instancia.

## Pruebas

Pruebas de servicio y regresión Sprint 1:

```powershell
dotnet test tests/unitarios/Solvex.Api.Tests/Solvex.Api.Tests.csproj
```

Pruebas SQL reales de recepción, concurrencia y rollback, contra una base **de desarrollo ya migrada**:

```powershell
$env:SOLVEX_SQL_TEST_CONNECTION='Server=.\SQLEXPRESS;Database=SolvexHu01Demo;Integrated Security=True;TrustServerCertificate=True'
dotnet test tests/integracion/Solvex.Api.SqlTests/Solvex.Api.SqlTests.csproj
```

El proyecto SQL falla explícitamente si falta la variable; no sustituye SQL por InMemory ni omite casos. Crea registros de prueba propios con identificadores únicos y los conserva, sin eliminar bases ni datos anteriores. No ejecutar en producción. Con runtime aislado en este equipo se definió `$env:DOTNET_ROOT=(Resolve-Path tmp/dotnet).Path` antes de `dotnet test`.

Con API iniciada, recorridos HTTP:

```powershell
$env:SOLVEX_TEST_API_URL='http://localhost:5080/api'
node tests/integracion/products-smoke.mjs
node tests/integracion/sprint1-smoke.mjs
node tests/integracion/sprint2-smoke.mjs
```

También conservan sus datos propios. Los casos de rollback se ejecutan con contextos independientes y comprueban los saldos y movimientos después del fallo. No hay pruebas ni cambios de frontend en este alcance.

## Documentación

- [Contrato de proveedores y compras para Diana](../docs/api/sprint2-contract.md): las siete operaciones, DTOs, ejemplos, errores y reglas de integración.
- [Modelo entidad-relación](../docs/modelo-entidad-relacion.md).
- [Migraciones](../docs/migrations.md).
- [Informe, trazabilidad Jira, evidencias y archivos](../docs/sprint2-backend.md).

Los campos de proveedor y límites de compra no detallados en SRS son decisiones documentadas a validar con el cliente. Solo se registra/consulta proveedores y se registra/consulta/recibe compras completas: no se implementan edición, eliminación, cancelación, recepción parcial, pagos ni frontend. JWT/RBAC y CI siguen pendientes.
