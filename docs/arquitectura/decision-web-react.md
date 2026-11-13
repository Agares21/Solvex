# Decisión de implementación: cliente web React

Fecha: 23/10/2026. Alcance: SCRUM-11 / HU-01 / RF-01.

Estado: cambio aprobado por el solicitante para esta implementación; pendiente de incorporación formal al documento de ADR y al modelo C2 existentes.

Se desarrolla exclusivamente una aplicación web responsive con React y TypeScript. No se crea un cliente Flutter. El flujo implementado es React → API REST ASP.NET Core 8 → Entity Framework Core 8 → SQL Server. Dentro de la API: Controllers → Services → Repositories → DbContext.

El C2 deberá retirar el contenedor móvil de este alcance y actualizar los flujos de acceso móvil hacia la web responsive. ADR-001 deberá describir React como único cliente actual. Redis y JWT/RBAC quedan diferidos por instrucción expresa; no se declara cumplido RNF-02. Los PDFs y diagramas originales se conservan.

La separación de rutas, componentes, tipos y cliente HTTP permite incorporar una PWA posteriormente. No se incluyen manifest, Service Workers ni caché offline. Las futuras transacciones de inventario requerirán un diseño explícito de sincronización.

Los documentos revisados describen las operaciones de productos, pero no un diccionario de campos. Se adoptan como decisiones iniciales a validar: código único de hasta 40 caracteres normalizado a mayúsculas, nombre obligatorio de hasta 150, descripción opcional de hasta 1000, precio obligatorio en Bs entre 0 y 99999999.99 con dos decimales, estado activo inicial. Los códigos permanecen reservados al desactivar. La edición conserva el estado y se permite sobre productos inactivos. Por solicitud posterior se permite activar y desactivar desde el detalle, conservando stock e historial. La entrega inicial de HU-01 no incluía stock; el Sprint 1 amplía RF-02 y RF-06 mediante saldo único, movimientos transaccionales y consulta de disponibilidad: ver [decisiones y pruebas](../sprint1.md).
