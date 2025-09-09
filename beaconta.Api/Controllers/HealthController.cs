using Microsoft.AspNetCore.Mvc;

namespace Beaconta.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "OK", time = DateTime.UtcNow });
}
