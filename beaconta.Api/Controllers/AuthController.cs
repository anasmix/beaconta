// beaconta.Api/Controllers/AuthController.cs
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
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
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {

            Console.WriteLine(">> Received Username: " + request?.Username);
            Console.WriteLine(">> Received Password: " + request?.Password);

            var res = await _auth.LoginAsync(request.Username, request.Password);
            if (res == null)
                return Unauthorized(new { message = "Invalid credentials" });

            return Ok(res);
        }


        //[HttpPost("login")]
        //[AllowAnonymous]
        //public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        //{
        //    var res = await _auth.LoginAsync(request.Username, request.Password);
        //    if (res == null)
        //        return Unauthorized(new { message = "Invalid credentials" });

        //    return Ok(res);
        //}

        [Authorize]
        [HttpGet("me")]
        public IActionResult Me()
        {
            return Ok(new { user = _current.Username, role = _current.Role });
        }
    }
}


public class LoginRequest
    {
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
    }

