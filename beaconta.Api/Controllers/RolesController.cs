using System.Text.Json;
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")] // تأكد أن التوكن يحمل ClaimTypes.Role = "Admin" (يفضّل وضع Role.Key = "Admin")
    public class RolesController : ControllerBase
    {
        private readonly IRoleService _service;

        public RolesController(IRoleService service)
        {
            _service = service;
        }

        // GET: api/Roles
        [HttpGet]
        public async Task<IActionResult> GetAll()
            => Ok(await _service.GetAllAsync());

        // GET: api/Roles/5
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var role = await _service.GetByIdAsync(id);
            return role == null ? NotFound() : Ok(role);
        }

        // POST: api/Roles
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateRoleDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.Name))
                return BadRequest("اسم المجموعة مطلوب.");

            var role = await _service.CreateAsync(dto.Name);
            return Ok(role);
        }

        // PUT: api/Roles/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateName(int id, [FromBody] UpdateRoleDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.Name))
                return BadRequest("اسم المجموعة مطلوب.");

            return await _service.UpdateNameAsync(id, dto.Name)
                ? Ok()
                : NotFound();
        }

        // DELETE: api/Roles/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
            => await _service.DeleteAsync(id) ? Ok() : NotFound();

        // PUT: api/Roles/5/permissions
        // يدعم:
        // 1) Body = ["Users.View","Users.Edit",...]
        // 2) Body = { "permissions": ["Users.View","Users.Edit",...] }
        [HttpPut("{id:int}/permissions")]
        public async Task<IActionResult> UpdatePermissions(int id, [FromBody] JsonElement body)
        {
            List<string> perms;

            if (body.ValueKind == JsonValueKind.Array)
            {
                perms = body.EnumerateArray()
                            .Select(x => x.ValueKind == JsonValueKind.String ? x.GetString() : null)
                            .Where(s => !string.IsNullOrWhiteSpace(s))
                            .Cast<string>()
                            .ToList();
            }
            else if (body.ValueKind == JsonValueKind.Object &&
                     body.TryGetProperty("permissions", out var p) &&
                     p.ValueKind == JsonValueKind.Array)
            {
                perms = p.EnumerateArray()
                         .Select(x => x.ValueKind == JsonValueKind.String ? x.GetString() : null)
                         .Where(s => !string.IsNullOrWhiteSpace(s))
                         .Cast<string>()
                         .ToList();
            }
            else
            {
                return BadRequest("صيغة الطلب غير صحيحة. أرسل مصفوفة مفاتيح أو كائن يحتوي على الحقل permissions.");
            }

            var dto = new UpdateRolePermissionsDto { RoleId = id, Permissions = perms };
            return await _service.UpdatePermissionsAsync(dto) ? Ok() : NotFound();
        }

        // GET: api/Roles/5/users
        [HttpGet("{id:int}/users")]
        public async Task<IActionResult> GetUsers(int id)
            => Ok(await _service.GetUsersByRoleIdAsync(id));

        // POST: api/Roles/5/clone
        [HttpPost("{id:int}/clone")]
        public async Task<IActionResult> ClonePermissions(int id, [FromBody] CloneRoleDto dto)
        {
            if (dto == null || dto.FromRoleId <= 0)
                return BadRequest("fromRoleId مطلوب.");
            if (dto.FromRoleId == id)
                return BadRequest("لا يمكن النسخ من نفس المجموعة.");

            return await _service.ClonePermissionsAsync(dto.FromRoleId, id)
                ? Ok()
                : BadRequest("فشل نسخ الصلاحيات.");
        }
    }

    // DTO لعملية النسخ
    public class CloneRoleDto
    {
        public int FromRoleId { get; set; }
    }
}
