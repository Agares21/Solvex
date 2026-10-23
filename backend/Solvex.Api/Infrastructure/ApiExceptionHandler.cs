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
            MovementNotFoundException => 404,
            InventoryConflictException => 409,
            ValidationException => 400,
            DuplicateProductCodeException => 409,
            DbUpdateException { InnerException: SqlException { Number: 2601 or 2627 } } => 409,
            _ => 500
        };
        if (status == 500) logger.LogError(error, "Error procesando {Path}", context.Request.Path);
        var message = status == 500 ? "No se pudo completar la operación. Inténtalo nuevamente."
            : error is DbUpdateException && status == 409 ? "Ya existe un producto con ese código." : error.Message;
        await Results.Problem(statusCode: status, title: message, extensions: new Dictionary<string, object?> { ["traceId"] = context.TraceIdentifier }).ExecuteAsync(context);
        return true;
    }
}
