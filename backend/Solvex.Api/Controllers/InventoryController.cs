using Microsoft.AspNetCore.Mvc;
using Solvex.Api.DTOs;
using Solvex.Api.Services;

namespace Solvex.Api.Controllers;

[ApiController, Route("api/inventory"), Produces("application/json")]
public sealed class InventoryController(InventoryService service) : ControllerBase
{
    /// <summary>Consulta existencias de todos los productos, incluidos inactivos.</summary>
    [HttpGet, ProducesResponseType(typeof(IReadOnlyList<StockDto>), 200)]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await service.ListAsync(ct));
    /// <summary>Consulta el saldo actual de un producto.</summary>
    [HttpGet("{productId:int}"), ProducesResponseType(typeof(StockDto), 200), ProducesResponseType(404)]
    public async Task<IActionResult> Get(int productId, CancellationToken ct) => Ok(await service.GetAsync(productId, ct));
    /// <summary>Consulta los últimos 50 movimientos del producto, primero los más recientes.</summary>
    [HttpGet("{productId:int}/movements"), ProducesResponseType(typeof(IReadOnlyList<MovementDto>), 200), ProducesResponseType(404)]
    public async Task<IActionResult> Movements(int productId, CancellationToken ct) => Ok(await service.MovementsAsync(productId, ct));
    /// <summary>Consulta un movimiento registrado.</summary>
    [HttpGet("movements/{id:long}"), ProducesResponseType(typeof(MovementDto), 200), ProducesResponseType(404)]
    public async Task<IActionResult> Movement(long id, CancellationToken ct) => Ok(await service.GetMovementAsync(id, ct));
    /// <summary>Registra Entry o Exit y actualiza el saldo atómicamente. No admite productos inactivos ni saldo negativo.</summary>
    [HttpPost("{productId:int}/movements"), ProducesResponseType(typeof(AdjustmentDto), 201), ProducesResponseType(400), ProducesResponseType(404), ProducesResponseType(409)]
    public async Task<IActionResult> Adjust(int productId, MovementInput input, CancellationToken ct)
    {
        var result = await service.AdjustAsync(productId, input, ct);
        return CreatedAtAction(nameof(Movement), new { id = result.Movement.Id }, result);
    }
}
