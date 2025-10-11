using beaconta.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // يمكن استبدالها بسياسات أدق مثل: fees.catalog.view / fees.links.view عند الحاجة
    [Produces("application/json")]
    public class FeesController : ControllerBase
    {
        private readonly IFeesService _svc;
        public FeesController(IFeesService svc) => _svc = svc;

        /// <summary>
        /// إرجاع بنود الرسوم (كتالوج) مع بحث اختياري وتقنين النتائج.
        /// GET: /api/fees/items?q=&take=
        /// </summary>
        [HttpGet("items")]
        public async Task<IActionResult> Items(
            [FromQuery] string? q = null,
            [FromQuery] int take = 50,
            CancellationToken ct = default)
        {
            // سقف/حد أدنى لعدد النتائج لحماية الخادم
            if (take <= 0) take = 20;
            if (take > 200) take = 200;

            var result = await _svc.GetFeeItemsAsync(q, take, ct);
            return Ok(result);
        }

        /// <summary>
        /// تُرجع الحزم مع عناصرها (كما يتوقع الفرونت).
        /// GET: /api/fees/bundles?gradeYearId=
        /// </summary>
        [HttpGet("bundles")]
        public async Task<IActionResult> Bundles(
            [FromQuery] int? gradeYearId,
            CancellationToken ct = default)
        {
            var result = await _svc.GetBundlesAsync(gradeYearId, ct);
            return Ok(result);
        }

        /// <summary>
        /// إرجاع حزمة محددة بالتفصيل.
        /// GET: /api/fees/bundles/{id}
        /// </summary>
        [HttpGet("bundles/{id:int}")]
        public async Task<IActionResult> Bundle(
            [FromRoute] int id,
            CancellationToken ct = default)
        {
            var dto = await _svc.GetBundleAsync(id, ct);
            return dto is null ? NotFound() : Ok(dto);
        }
    }
}
