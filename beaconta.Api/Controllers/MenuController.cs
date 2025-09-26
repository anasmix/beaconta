using beaconta.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // لازم يكون مسجل دخول
    public class MenuController : ControllerBase
    {
        private readonly IMenuService _menu;

        public MenuController(IMenuService menu) => _menu = menu;

        [HttpGet("my")]
        public async Task<IActionResult> GetMyMenu(CancellationToken ct)
        {
            var data = await _menu.GetMenuForCurrentUserAsync(ct);
            return Ok(data);
        }




    }
}
