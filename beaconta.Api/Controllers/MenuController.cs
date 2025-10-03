using System.Net.Mime;
using beaconta.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/menu")]                      // مسار ثابت
    [Authorize]                              // أي مستخدم مُسجّل
    [Produces(MediaTypeNames.Application.Json)]
    public class MenuController : ControllerBase
    {
        private readonly IMenuService _menu;

        public MenuController(IMenuService menu) => _menu = menu;

        // GET /api/menu/my
        [HttpGet("my")]
        public async Task<IActionResult> GetMyMenu(CancellationToken ct)
            => Ok(await _menu.GetMenuForCurrentUserAsync(ct));

        // GET /api/menu/catalog
        [HttpGet("catalog")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetCatalog(CancellationToken ct)
            => Ok(await _menu.GetMenuCatalogAsync(ct));

        // POST /api/menu/invalidate/{userId}
        [HttpPost("invalidate/{userId:int}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Invalidate(int userId)
        {
            await _menu.InvalidateCacheForUserAsync(userId);
            return Ok(new { message = "Cache cleared" });
        }
    }
}
