using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]                 // => /api/feebundles
    [Authorize]                                  // غطِّيه بسياساتك
    public class FeeBundlesController : ControllerBase
    {
        private readonly IFeeBundlesService _svc;
        public FeeBundlesController(IFeeBundlesService svc) => _svc = svc;

        // POST: /api/feebundles
        [HttpPost]
        [Authorize(Policy = "fees.bundles.manage")]
        public async Task<IActionResult> Create([FromBody] SaveFeeBundleDto dto, CancellationToken ct = default)
        {
            if (dto is null) return BadRequest("Payload is required.");
            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Name is required.");
            if (dto.Items is null || dto.Items.Count == 0) return BadRequest("At least one bundle item is required.");

            var saved = await _svc.CreateAsync(dto, ct);
            // يعيد 201 + جسم الحزمة
            return CreatedAtAction(nameof(GetOne), new { id = saved.Id }, saved);
        }

        // GET: /api/feebundles/{id}
        [HttpGet("{id:int}")]
        [Authorize(Policy = "fees.bundles.view")]
        public async Task<IActionResult> GetOne([FromRoute] int id, CancellationToken ct = default)
        {
            // إن كانت لديك طريقة في IFeeBundlesService لاسترجاع حزمة واحدة.. استخدمها
            // وإلا مؤقتًا يمكنك إرجاع 405 أو ربطها بخدمة IFeesService.GetBundleAsync
            var dto = await _svc.GetAsync(id, ct);    // ← أضف هذا المتطلب للإنترفيس والسيرفس
            return dto is null ? NotFound() : Ok(dto);
        }

        // PUT: /api/feebundles/{id}
        [HttpPut("{id:int}")]
        [Authorize(Policy = "fees.bundles.manage")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] SaveFeeBundleDto dto, CancellationToken ct = default)
        {
            if (dto is null) return BadRequest("Payload is required.");
            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Name is required.");
            if (dto.Items is null || dto.Items.Count == 0) return BadRequest("At least one bundle item is required.");

            var saved = await _svc.UpdateAsync(id, dto, ct);
            return Ok(saved);
        }

        // DELETE: /api/feebundles/{id}
        [HttpDelete("{id:int}")]
        [Authorize(Policy = "fees.bundles.manage")]
        public async Task<IActionResult> Delete([FromRoute] int id, CancellationToken ct = default)
        {
            await _svc.DeleteAsync(id, ct);
            return NoContent();
        }
    }
}
