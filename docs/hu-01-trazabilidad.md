# SCRUM-11 — HU-01 — RF-01

Épica: SCRUM-5. Fuente: SRS V1.0, sección 4 RF-01, sección 7 HU-01 y sección 8 CP-01; minuta de entrevista, registro centralizado de productos; arquitectura C3 y ADR-001/002. SolvexFin.pdf no se encontró en el workspace.

| Criterio | API | React | Verificación |
| --- | --- | --- | --- |
| Registrar | POST /api/products, ProductService.CreateAsync | ProductForm, ProductPage create | Create_NormalizesAndPersists; smoke HTTP |
| Modificar | PUT /api/products/{id}, UpdateAsync | ProductPage edit | Update_ChangesFieldsAndPreservesId; smoke HTTP |
| Consultar catálogo | GET /api/products, ListAsync | CatalogPage, búsqueda local | Deactivate_PreservesProductAndIsIdempotent; smoke HTTP |
| Consultar detalle | GET /api/products/{id}, GetAsync | ProductPage detail | Get_ReturnsProduct; MissingProduct_IsReportedForAllOperations; smoke HTTP |
| Desactivar | PATCH /api/products/{id}/deactivate | Confirmación en detalle | Deactivate_PreservesProductAndIsIdempotent; smoke HTTP |
| Validar | ProductInput, ProductService.Validate, índice único SQL | Campos HTML, feedback de ProblemDetails | Create_RejectsInvalidData, Create_RequiresPrice, Create_RejectsExcessiveLengths, pruebas de duplicados; http.test.ts |

Implementación: `backend/Solvex.Api/{Controllers,Services,Repositories,Entities,DTOs,Data,Infrastructure}`. Pruebas unitarias: `tests/unitarios/Solvex.Api.Tests/ProductServiceTests.cs`. Integración real HTTP/SQL: `tests/integracion/products-smoke.mjs`. Cliente HTTP: `frontend/src/services/http.test.ts`.

## CP-01: recorrido manual de aceptación

1. Abrir `/products` en una base nueva: mostrar estado vacío y acción Registrar.
2. Registrar código `CUA-001`, nombre `Cuaderno`, precio `12.50`: mostrar mensaje de éxito y fila activa.
3. Abrir detalle y comprobar datos persistidos. Recargar la página.
4. Editar nombre/precio: regresar al catálogo con mensaje y valores actualizados.
5. Intentar guardar campos vacíos, precio negativo o código repetido: informar error y conservar datos.
6. Desactivar desde detalle: primero cancelar y comprobar estado activo; después confirmar, comprobar estado inactivo y permanencia en catálogo.
7. Abrir `/products/2147483647`: informar que no existe. Detener API: mostrar error de conexión y permitir reintentar en catálogo.
8. Repetir a 390 px, 768 px y escritorio: navegación, formularios y acciones utilizables; tabla desplazable horizontalmente.

El recorrido visual queda como verificación manual cuando no hay navegador conectado; las pruebas del cliente HTTP no lo sustituyen.
