using beaconta.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin")]
    public class PermissionsController : ControllerBase
    {
        private readonly IPermissionService _service;

        public PermissionsController(IPermissionService service)
        {
            _service = service;
        }
        [HttpGet("grouped")]
        public async Task<IActionResult> GetGrouped()
        {
            var result = await _service.GetAllAsync();
            var grouped = result
                .GroupBy(p => p.Category)
                .Select(g => new {
                    Category = g.Key,
                    Permissions = g.ToList()
                });
            return Ok(grouped);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("category/{category}")]
        public async Task<IActionResult> GetByCategory(string category)
        {
            var result = await _service.GetByCategoryAsync(category);
            return Ok(result);
        }
    }
}
