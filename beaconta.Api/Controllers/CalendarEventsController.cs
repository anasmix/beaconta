using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Api.Validators;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc; 
using Microsoft.AspNetCore.Mvc.ModelBinding; // ليس إلزاميًا هنا لكنه جيد

namespace beaconta.Api.Controllers;

[ApiController]
[Route("api/calendar-events")] // 👈 مسار ثابت

public class CalendarEventsController : ControllerBase
{
    private readonly ICalendarEventService _svc;
    private readonly IValidator<CalendarEventUpsertDto> _validator;

    public CalendarEventsController(ICalendarEventService svc, IValidator<CalendarEventUpsertDto> validator)
    { _svc = svc; _validator = validator; }

    // GET: /api/calendar-events?yearId=123
    [HttpGet]
    [Authorize(Policy = "calendar.view")]
    [ProducesResponseType(typeof(List<CalendarEventDto>), 200)]
    public async Task<IActionResult> List([FromQuery] int yearId, CancellationToken ct)
        => Ok(await _svc.GetByYearAsync(yearId, ct));

    [HttpPost]
    [Authorize(Policy = "calendar.manage")]
    [ProducesResponseType(typeof(CalendarEventDto), 201)]
    public async Task<IActionResult> Create([FromBody] CalendarEventUpsertDto dto, CancellationToken ct)
    {
        // POST
        var vr = await _validator.ValidateAsync(dto, ct);
        if (!vr.IsValid) return ValidationProblem(vr.ToModelState());
        var saved = await _svc.UpsertAsync(dto with { Id = null }, ct);
        return CreatedAtAction(nameof(GetById), new { id = saved.Id }, saved);
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = "calendar.view")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
        => (await _svc.GetByIdAsync(id, ct)) is { } dto ? Ok(dto) : NotFound();

    [HttpPut("{id:int}")]
    [Authorize(Policy = "calendar.manage")]
    public async Task<IActionResult> Update(int id, [FromBody] CalendarEventUpsertDto dto, CancellationToken ct)
    {
        var vr = await _validator.ValidateAsync(dto, ct);

        dto.Id = id;
        vr = await _validator.ValidateAsync(dto, ct);
        if (!vr.IsValid) return ValidationProblem(vr.ToModelState());
        return Ok(await _svc.UpsertAsync(dto, ct));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "calendar.manage")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => (await _svc.DeleteAsync(id, ct)) ? NoContent() : NotFound();
}
