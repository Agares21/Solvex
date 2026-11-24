using Microsoft.AspNetCore.Mvc;
using Solvex.Api.DTOs;
using Solvex.Api.Services;

namespace Solvex.Api.Controllers;

[ApiController, Route("api/orders"), Produces("application/json")]
public sealed class OrdersController(IOrderService service) : ControllerBase
{
    [HttpGet, ProducesResponseType(typeof(IReadOnlyList<OrderSummaryDto>), 200)]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await service.ListAsync(ct));
    [HttpGet("{id:int}"), ProducesResponseType(typeof(OrderDto), 200), ProducesResponseType(404)]
    public async Task<IActionResult> Get(int id, CancellationToken ct) => Ok(await service.GetAsync(id, ct));
    [HttpPost, ProducesResponseType(typeof(OrderDto), 201), ProducesResponseType(400), ProducesResponseType(404)]
    public async Task<IActionResult> Create(OrderInput input, CancellationToken ct)
    {
        var order = await service.CreateAsync(input, ct);
        return CreatedAtAction(nameof(Get), new { id = order.Id }, order);
    }
    [HttpPut("{id:int}"), ProducesResponseType(typeof(OrderDto), 200), ProducesResponseType(400), ProducesResponseType(404)]
    public async Task<IActionResult> Update(int id, OrderInput input, CancellationToken ct) => Ok(await service.UpdateAsync(id, input, ct));
}
