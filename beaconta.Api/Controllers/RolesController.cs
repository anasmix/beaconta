using System.Text.Json;
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin")]
    public class RolesController : ControllerBase
    {
        private readonly IRoleService _service;
        public RolesController(IRoleService service) { _service = service; }

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var role = await _service.GetByIdAsync(id);
            return role == null ? NotFound() : Ok(role);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateRoleDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.Name))
                return BadRequest("اسم المجموعة مطلوب.");
            var role = await _service.CreateAsync(dto.Name);
            return Ok(role);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateName(int id, [FromBody] UpdateRoleDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.Name))
                return BadRequest("اسم المجموعة مطلوب.");

            var updatedRole = await _service.UpdateNameAsync(id, dto.Name);
            if (updatedRole == null)
                return NotFound();

            return Ok(updatedRole);
        }
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _service.DeleteAsync(id);

            if (!success)
                return BadRequest(new { message = "لا يمكن حذف المجموعة (غير موجودة أو مرتبطة بمستخدمين)." });

            return Ok(new { message = "تم الحذف بنجاح." });
        }


        // يقبل body: [1,2,3] أو { permissionIds: [1,2,3] }
        [HttpPut("{id:int}/permissions")]
        public async Task<IActionResult> UpdatePermissions(int id, [FromBody] JsonElement body)
        {
            List<int> permIds;

            if (body.ValueKind == JsonValueKind.Array)
            {
                permIds = body.EnumerateArray()
                              .Where(x => x.ValueKind == JsonValueKind.Number)
                              .Select(x => x.GetInt32()).ToList();
            }
            else if (body.ValueKind == JsonValueKind.Object &&
                     body.TryGetProperty("permissionIds", out var p) &&
                     p.ValueKind == JsonValueKind.Array)
            {
                permIds = p.EnumerateArray()
                           .Where(x => x.ValueKind == JsonValueKind.Number)
                           .Select(x => x.GetInt32()).ToList();
            }
            else
            {
                return BadRequest("صيغة الطلب غير صحيحة.");
            }

            var dto = new UpdateRolePermissionsDto { RoleId = id, PermissionIds = permIds };
            var updatedRole = await _service.UpdatePermissionsAsync(dto);
            return updatedRole == null ? NotFound() : Ok(updatedRole);
        }

        [HttpGet("{id:int}/users")]
        public async Task<IActionResult> GetUsers(int id)
            => Ok(await _service.GetUsersByRoleIdAsync(id));

        [HttpPost("{id:int}/clone")]
        public async Task<IActionResult> ClonePermissions(int id, [FromBody] CloneRoleDto dto)
        {
            if (dto == null || dto.FromRoleId <= 0) return BadRequest("fromRoleId مطلوب.");
            if (dto.FromRoleId == id) return BadRequest("لا يمكن النسخ من نفس المجموعة.");

            var updated = await _service.ClonePermissionsAsync(dto.FromRoleId, id);
            return updated == null ? BadRequest("فشل نسخ الصلاحيات.") : Ok(updated); // ✅ يرجّع RoleDto
        }
    }

    public class CloneRoleDto { public int FromRoleId { get; set; } }
}
