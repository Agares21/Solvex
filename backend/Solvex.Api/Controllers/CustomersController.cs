using Microsoft.AspNetCore.Mvc;
using Solvex.Api.DTOs;
using Solvex.Api.Services;

namespace Solvex.Api.Controllers;

[ApiController, Route("api/customers"), Produces("application/json")]
public sealed class CustomersController(ICustomerService service) : ControllerBase
{
    [HttpGet, ProducesResponseType(typeof(IReadOnlyList<CustomerDto>), 200)]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await service.ListAsync(ct));
    [HttpGet("{id:int}"), ProducesResponseType(typeof(CustomerDto), 200), ProducesResponseType(404)]
    public async Task<IActionResult> Get(int id, CancellationToken ct) => Ok(await service.GetAsync(id, ct));
    [HttpPost, ProducesResponseType(typeof(CustomerDto), 201), ProducesResponseType(400)]
    public async Task<IActionResult> Create(CustomerInput input, CancellationToken ct)
    {
        var customer = await service.CreateAsync(input, ct);
        return CreatedAtAction(nameof(Get), new { id = customer.Id }, customer);
    }
    [HttpPut("{id:int}"), ProducesResponseType(typeof(CustomerDto), 200), ProducesResponseType(400), ProducesResponseType(404)]
    public async Task<IActionResult> Update(int id, CustomerInput input, CancellationToken ct) => Ok(await service.UpdateAsync(id, input, ct));
    [HttpGet("{id:int}/history"), ProducesResponseType(typeof(CustomerHistoryDto), 200), ProducesResponseType(404)]
    public async Task<IActionResult> History(int id, CancellationToken ct) => Ok(await service.HistoryAsync(id, ct));
}
