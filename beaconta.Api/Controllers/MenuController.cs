using beaconta.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MenuController : ControllerBase
    {
        private readonly IMenuService _menu;

        public MenuController(IMenuService menu) => _menu = menu;

        // ✅ قائمة المستخدم المفلترة
        [HttpGet("my")]
        public async Task<IActionResult> GetMyMenu(CancellationToken ct)
        {
            var data = await _menu.GetMenuForCurrentUserAsync(ct);
            return Ok(data);
        }

        // ✅ الكاتالوج الكامل (لعرضه في إدارة المجموعات)
        [HttpGet("catalog")]
        [Authorize(Roles = "admin")] // أو حسب ما تحب
        public async Task<IActionResult> GetCatalog(CancellationToken ct)
        {
            var data = await _menu.GetMenuCatalogAsync(ct);
            return Ok(data);
        }

        [HttpPost("invalidate/{userId:int}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Invalidate(int userId)
        {
            await _menu.InvalidateCacheForUserAsync(userId);
            return Ok(new { message = "Cache cleared" });
        }


    }
}
