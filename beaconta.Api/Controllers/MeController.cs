using System.Net.Mime;
using beaconta.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]  // => api/me
    [Authorize]
    [Produces(MediaTypeNames.Application.Json)]
    public class MeController : ControllerBase
    {
        private readonly IMenuRepository _menuRepo;
        private readonly ICurrentUserService _current;
        private readonly ILogger<MeController> _logger;

        public MeController(
            IMenuRepository menuRepo,
            ICurrentUserService current,
            ILogger<MeController> logger)
        {
            _menuRepo = menuRepo ?? throw new ArgumentNullException(nameof(menuRepo));
            _current = current ?? throw new ArgumentNullException(nameof(current));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>يرجّع مفاتيح الصلاحيات للمستخدم الحالي.</summary>
        [HttpGet("perms")]
        [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetPermissions(CancellationToken ct = default)
        {
            ct = HttpContext?.RequestAborted ?? ct;

            var userIdStr = _current.UserId;
            if (string.IsNullOrWhiteSpace(userIdStr) || !int.TryParse(userIdStr, out var userId))
            {
                _logger.LogWarning("GetPermissions: Invalid current user id. Raw='{UserIdStr}'", userIdStr);
                return BadRequest(new { message = "Invalid current user id." });
            }

            try
            {
                var keys = await _menuRepo.GetPermissionKeysForUserAsync(userId, ct) ?? new HashSet<string>();
                var ordered = keys.OrderBy(k => k, StringComparer.Ordinal).ToArray();
                return Ok(ordered);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("MeController.GetPermissions cancelled by client.");
                return Problem(statusCode: StatusCodes.Status499ClientClosedRequest, title: "Client closed request");
            }
        }
    }
}
