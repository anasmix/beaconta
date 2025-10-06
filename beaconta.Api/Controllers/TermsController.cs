using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Api.Validators;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace beaconta.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TermsController : ControllerBase
{
    private readonly ITermYearService _svc;
    private readonly IValidator<TermYearUpsertDto> _validator;

    public TermsController(ITermYearService svc, IValidator<TermYearUpsertDto> validator)
    { _svc = svc; _validator = validator; }

    // GET: /api/terms?yearId=123
    [HttpGet]
    [Authorize(Policy = "terms.view")]
    [ProducesResponseType(typeof(List<TermYearDto>), 200)]
    public async Task<IActionResult> List([FromQuery] int yearId, CancellationToken ct)
        => Ok(await _svc.GetByYearAsync(yearId, ct));

    [HttpGet("{id:int}")]
    [Authorize(Policy = "terms.view")]
    [ProducesResponseType(typeof(TermYearDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
        => (await _svc.GetByIdAsync(id, ct)) is { } dto ? Ok(dto) : NotFound();

    [HttpPost]
    [Authorize(Policy = "terms.manage")]
    [ProducesResponseType(typeof(TermYearDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> Create([FromBody] TermYearUpsertDto dto, CancellationToken ct)
    {
        var vr = await _validator.ValidateAsync(dto, ct);
        if (!vr.IsValid) return ValidationProblem(vr.ToModelState());
        try
        {
            dto.Id = null;
            var saved = await _svc.UpsertAsync(dto, ct);
            return CreatedAtAction(nameof(GetById), new { id = saved.Id }, saved);
        }
        catch (InvalidOperationException ex) when (ex.Message == "TERM_OVERLAP")
        {
            return Conflict(new { code = "TERM_OVERLAP", message = "نطاق الفصل يتعارض مع فصل آخر." });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "terms.manage")]
    [ProducesResponseType(typeof(TermYearDto), 200)]
    public async Task<IActionResult> Update(int id, [FromBody] TermYearUpsertDto dto, CancellationToken ct)
    {
        dto.Id = id;
        var vr = await _validator.ValidateAsync(dto, ct);

        vr = await _validator.ValidateAsync(dto, ct);
        if (!vr.IsValid) return ValidationProblem(vr.ToModelState());
        try
        {
            var saved = await _svc.UpsertAsync(dto, ct);
            return Ok(saved);
        }
        catch (InvalidOperationException ex) when (ex.Message == "TERM_OVERLAP")
        {
            return Conflict(new { code = "TERM_OVERLAP", message = "نطاق الفصل يتعارض مع فصل آخر." });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "terms.manage")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => (await _svc.DeleteAsync(id, ct)) ? NoContent() : NotFound();
}
