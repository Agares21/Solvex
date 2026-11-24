using Microsoft.AspNetCore.Mvc;
using Solvex.Api.DTOs;
using Solvex.Api.Services;

namespace Solvex.Api.Controllers;

[ApiController, Route("api/mockups"), Produces("application/json")]
public sealed class MockupsController(IMockupService service) : ControllerBase
{
    [HttpGet, ProducesResponseType(typeof(IReadOnlyList<MockupSummaryDto>), 200)]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await service.ListAsync(ct));
    [HttpGet("{id:int}"), ProducesResponseType(typeof(MockupDto), 200), ProducesResponseType(404)]
    public async Task<IActionResult> Get(int id, CancellationToken ct) => Ok(await service.GetAsync(id, ct));
    [HttpPost, ProducesResponseType(typeof(MockupDto), 201), ProducesResponseType(400), ProducesResponseType(404)]
    public async Task<IActionResult> Create(MockupInput input, CancellationToken ct)
    {
        var mockup = await service.CreateAsync(input, ct);
        return CreatedAtAction(nameof(Get), new { id = mockup.Id }, mockup);
    }
    [HttpPost("{id:int}/payments"), ProducesResponseType(typeof(MockupDto), 200), ProducesResponseType(400), ProducesResponseType(404), ProducesResponseType(409)]
    public async Task<IActionResult> AddPayment(int id, MockupPaymentInput input, CancellationToken ct) => Ok(await service.AddPaymentAsync(id, input, ct));
    [HttpPut("{id:int}/status"), ProducesResponseType(typeof(MockupDto), 200), ProducesResponseType(400), ProducesResponseType(404), ProducesResponseType(409)]
    public async Task<IActionResult> UpdateStatus(int id, MockupStatusInput input, CancellationToken ct) => Ok(await service.UpdateStatusAsync(id, input, ct));
}
