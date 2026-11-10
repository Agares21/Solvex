using Microsoft.AspNetCore.Mvc;
using Solvex.Api.DTOs;
using Solvex.Api.Services;

namespace Solvex.Api.Controllers;

[ApiController, Route("api/purchases"), Produces("application/json")]
public sealed class PurchasesController(PurchaseService service) : ControllerBase
{
    /// <summary>Lista resúmenes de compras, primero la más reciente. No incluye Details.</summary>
    [HttpGet, ProducesResponseType(typeof(IReadOnlyList<PurchaseSummaryDto>), 200)]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await service.ListAsync(ct));
    /// <summary>Consulta cabecera, proveedor y detalles de una compra.</summary>
    [HttpGet("{id:int}"), ProducesResponseType(typeof(PurchaseDto), 200), ProducesResponseType(404)]
    public async Task<IActionResult> Get(int id, CancellationToken ct) => Ok(await service.GetAsync(id, ct));
    /// <summary>Registra una compra Pending con 1–100 productos activos distintos. El servidor calcula importes; no modifica stock.</summary>
    [HttpPost, ProducesResponseType(typeof(PurchaseDto), 201), ProducesResponseType(400), ProducesResponseType(404), ProducesResponseType(409)]
    public async Task<IActionResult> Create(PurchaseInput input, CancellationToken ct)
    {
        var result = await service.CreateAsync(input, ct);
        return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
    }
    /// <summary>Recibe toda la compra una sola vez y registra entradas de inventario en una transacción. Sin cuerpo de solicitud.</summary>
    [HttpPost("{id:int}/receive"), ProducesResponseType(typeof(PurchaseDto), 200), ProducesResponseType(404), ProducesResponseType(409)]
    public async Task<IActionResult> Receive(int id, CancellationToken ct) => Ok(await service.ReceiveAsync(id, ct));
}
