using beaconta.Application.Interfaces;
using beaconta.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _auth;
        private readonly ICurrentUserService _current;

        public AuthController(IAuthService auth, ICurrentUserService current)
        {
            _auth = auth;
            _current = current;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var token = await _auth.LoginAsync(request.Username, request.Password);
            if (token == null)
                return Unauthorized(new { message = "Invalid credentials" });

            return Ok(new { token });
        }

        [Authorize]
        [HttpGet("me")]
        public IActionResult Me() => Ok(new { user = _current.Username, role = _current.Role });
    }

    public class LoginRequest
    {
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
    }
}
