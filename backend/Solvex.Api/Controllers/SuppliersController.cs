using Microsoft.AspNetCore.Mvc;
using Solvex.Api.DTOs;
using Solvex.Api.Services;

namespace Solvex.Api.Controllers;

[ApiController, Route("api/suppliers"), Produces("application/json")]
public sealed class SuppliersController(SupplierService service) : ControllerBase
{
    /// <summary>Lista proveedores. search busca coincidencias parciales en nombre o identificador (máximo 150 caracteres).</summary>
    [HttpGet, ProducesResponseType(typeof(IReadOnlyList<SupplierDto>), 200), ProducesResponseType(400)]
    public async Task<IActionResult> List([FromQuery] string? search, CancellationToken ct) => Ok(await service.ListAsync(search, ct));
    /// <summary>Consulta un proveedor por su ID interno.</summary>
    [HttpGet("{id:int}"), ProducesResponseType(typeof(SupplierDto), 200), ProducesResponseType(404)]
    public async Task<IActionResult> Get(int id, CancellationToken ct) => Ok(await service.GetAsync(id, ct));
    /// <summary>Registra un proveedor con identificador único y al menos un teléfono o correo válido.</summary>
    [HttpPost, ProducesResponseType(typeof(SupplierDto), 201), ProducesResponseType(400), ProducesResponseType(409)]
    public async Task<IActionResult> Create(SupplierInput input, CancellationToken ct)
    {
        var result = await service.CreateAsync(input, ct);
        return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
    }
}
