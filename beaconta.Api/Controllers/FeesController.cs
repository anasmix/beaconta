using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FeesController : ControllerBase
    {
        private readonly IFeesService _svc;
        public FeesController(IFeesService svc) => _svc = svc;

        [HttpGet("items")]
        public async Task<IActionResult> Items(CancellationToken ct) => Ok(await _svc.GetFeeItemsAsync(ct));

        [HttpGet("bundles")]
        public async Task<IActionResult> Bundles([FromQuery] int? gradeYearId, CancellationToken ct)
            => Ok(await _svc.GetBundlesAsync(gradeYearId, ct));

        [HttpGet("bundles/{id:int}")]
        public async Task<IActionResult> Bundle([FromRoute] int id, CancellationToken ct)
        {
            var dto = await _svc.GetBundleAsync(id, ct);
            return dto is null ? NotFound() : Ok(dto);
        }
    }

}
