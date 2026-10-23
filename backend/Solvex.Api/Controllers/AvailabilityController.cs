using Microsoft.AspNetCore.Mvc;
using Solvex.Api.DTOs;
using Solvex.Api.Services;

namespace Solvex.Api.Controllers;

[ApiController, Route("api/availability"), Produces("application/json")]
public sealed class AvailabilityController(IAvailabilityService service) : ControllerBase
{
    /// <summary>Verifica entre 1 y 100 productos distintos sin reservar ni modificar stock. Los inactivos no se consideran disponibles.</summary>
    [HttpPost, ProducesResponseType(typeof(AvailabilityDto), 200), ProducesResponseType(400), ProducesResponseType(404)]
    public async Task<IActionResult> Check(AvailabilityInput input, CancellationToken ct) => Ok(await service.CheckAsync(input, ct));
}
