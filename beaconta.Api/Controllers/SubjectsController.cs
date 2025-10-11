using AutoMapper;
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;          // ← يوفر AsNoTracking, ToListAsync, Where (EF)
using AutoMapper.QueryableExtensions;         // ← يوفر ProjectTo

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubjectsController : ControllerBase
{
    private readonly ISubjectsService _svc;
    public SubjectsController(ISubjectsService svc) => _svc = svc;

    // GET: /api/subjects?gradeYearId=&yearId=
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int? gradeYearId, [FromQuery] int? yearId, CancellationToken ct)
        => Ok(await _svc.GetSubjectsAsync(gradeYearId, yearId, ct));
}

