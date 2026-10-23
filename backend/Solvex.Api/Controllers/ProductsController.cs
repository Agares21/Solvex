using Microsoft.AspNetCore.Mvc;
using Solvex.Api.DTOs;
using Solvex.Api.Services;

namespace Solvex.Api.Controllers;

[ApiController]
[Route("api/products")]
[Produces("application/json")]
public sealed class ProductsController(ProductService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductDto>>> List(CancellationToken ct) => Ok(await service.ListAsync(ct));
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ProductDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ProductDto>> Get(int id, CancellationToken ct) => Ok(await service.GetAsync(id, ct));
    [HttpPost]
    [ProducesResponseType(typeof(ProductDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    public async Task<ActionResult<ProductDto>> Create(ProductInput input, CancellationToken ct)
    {
        var product = await service.CreateAsync(input, ct);
        return CreatedAtAction(nameof(Get), new { id = product.Id }, product);
    }
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ProductDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<ActionResult<ProductDto>> Update(int id, ProductInput input, CancellationToken ct) => Ok(await service.UpdateAsync(id, input, ct));
    [HttpPatch("{id:int}/deactivate")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Deactivate(int id, CancellationToken ct) { await service.DeactivateAsync(id, ct); return NoContent(); }
}
