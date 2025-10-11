using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "fees.links.view")]
    public class FeesLinksController : ControllerBase
    {
        private readonly IFeesLinksService _svc;
        public FeesLinksController(IFeesLinksService svc) => _svc = svc;

        // GET: /api/feeslinks?schoolId=&yearId=&stageId=&gradeYearId=&sectionYearId=
        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] int schoolId,
            [FromQuery] int yearId,
            [FromQuery] int? stageId,
            [FromQuery] int? gradeYearId,
            [FromQuery] int? sectionYearId,
            CancellationToken ct)
            => Ok(await _svc.GetLinksAsync(schoolId, yearId, stageId, gradeYearId, sectionYearId, ct));

        // POST: /api/feeslinks/bulk
        [HttpPost("bulk")]
        [Authorize(Policy = "fees.links.manage")]
        public async Task<IActionResult> CreateBulk([FromBody] CreateLinksBulkRequest req, CancellationToken ct)
        { await _svc.CreateLinksBulkAsync(req, ct); return NoContent(); }

        // PUT: /api/feeslinks/{id}
        [HttpPut("{id:int}")]
        [Authorize(Policy = "fees.links.manage")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] UpdateFeeLinkRequest req, CancellationToken ct)
        { await _svc.UpdateLinkAsync(id, req, ct); return NoContent(); }

        // DELETE: /api/feeslinks/{id}
        [HttpDelete("{id:int}")]
        [Authorize(Policy = "fees.links.manage")]
        public async Task<IActionResult> Delete([FromRoute] int id, CancellationToken ct)
        { await _svc.DeleteLinkAsync(id, ct); return NoContent(); }
    }
}
