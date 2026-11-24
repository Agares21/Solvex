using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Solvex.Api.Services;

namespace Solvex.Api.Infrastructure;

public sealed class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception error, CancellationToken ct)
    {
        var status = error switch
        {
            ProductNotFoundException => 404,
            SupplierNotFoundException => 404,
            PurchaseNotFoundException => 404,
            DuplicateSupplierIdentifierException => 409,
            PurchaseConflictException => 409,
            MovementNotFoundException => 404,
            InventoryConflictException => 409,
            ValidationException => 400,
            DuplicateProductCodeException => 409,
            DuplicateProductNameException => 409,
            CustomerNotFoundException => 404,
            OrderNotFoundException => 404,
            MockupNotFoundException => 404,
            PaymentConflictException => 409,
            MockupStatusConflictException => 409,
            DbUpdateException { InnerException: SqlException { Number: 2601 or 2627 } } => 409,
            _ => 500
        };
        if (status == 500) logger.LogError(error, "Error procesando {Path}", context.Request.Path);
        var duplicateName = error is DbUpdateException { InnerException: SqlException { Number: 2601 or 2627 } sql }
            && sql.Message.Contains("IX_Products_NormalizedName", StringComparison.Ordinal);
        var message = duplicateName ? "Ya existe un producto con ese nombre."
            : status == 500 ? "No se pudo completar la operación. Inténtalo nuevamente."
            : error is DbUpdateException && status == 409 ? "El registro entra en conflicto con un identificador o recepción existente." : error.Message;
        await Results.Problem(statusCode: status, title: message, extensions: new Dictionary<string, object?> { ["traceId"] = context.TraceIdentifier }).ExecuteAsync(context);
        return true;
    }
}
