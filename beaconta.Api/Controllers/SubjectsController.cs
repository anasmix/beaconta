using beaconta.Application.DTOs;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/subjects")]
    public class SubjectsController : ControllerBase
    {
        private readonly BeacontaDb _db;
        public SubjectsController(BeacontaDb db) => _db = db;

        // ========= DTOs للطلبات =========
        public class SubjectCreateRequest
        {
            public string Code { get; set; } = default!;
            public string Name { get; set; } = default!;
            public int Hours { get; set; } = 0;
            public string? Note { get; set; }
        }

        public class SubjectUpdateRequest
        {
            public string Code { get; set; } = default!;
            public string Name { get; set; } = default!;
            public int Hours { get; set; } = 0;
            public string? Note { get; set; }
        }

        public class SubjectSearchRequest
        {
            public int? YearId { get; set; }
            public int? StageId { get; set; }
            public int? GradeYearId { get; set; }
            public string? Q { get; set; }
        }

        // ========= GET: /api/subjects?yearId=&stageId=&gradeYearId=&q= =========
        // ملاحظة: حالياً المواد مستقلة، لذا الفلاتر اختيارية (للتوافق مع الواجهة)
        [HttpGet]
        [Authorize(Policy = "subjects-curricula.view")]
        public async Task<IActionResult> List(
            [FromQuery] int? yearId,
            [FromQuery] int? stageId,
            [FromQuery] int? gradeYearId,
            [FromQuery] string? q,
            CancellationToken ct)
        {
            var qry = _db.Subjects.AsNoTracking().AsQueryable();

            // فلاتر اختيارية (لا تغيّر النتائج إن لم تكن مرتبطة فعلياً بجدول آخر)
            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim();
                qry = qry.Where(s => s.Code.Contains(term) || s.Name.Contains(term));
            }

            var rows = await qry
                .OrderBy(s => s.Code)
                .ThenBy(s => s.Name)
                .Select(s => new SubjectDto(
                    s.Id,
                    s.Code,
                    s.Name,
                    s.Hours,
                    s.Note
                ))
                .ToListAsync(ct);

            return Ok(rows);
        }

        // ========= POST: /api/subjects/search  (توافق مع الفرونت لو استعمل POST) =========
        [HttpPost("search")]
        [Authorize(Policy = "subjects-curricula.view")]
        public Task<IActionResult> Search([FromBody] SubjectSearchRequest req, CancellationToken ct)
        {
            // نعيد استخدام منطق List مع نفس الفلاتر (q فقط حالياً فعّال)
            return List(req.YearId, req.StageId, req.GradeYearId, req.Q, ct);
        }

        // ========= GET: /api/subjects/{id} =========
        [HttpGet("{id:int}")]
        [Authorize(Policy = "subjects-curricula.view")]
        public async Task<IActionResult> GetById([FromRoute] int id, CancellationToken ct)
        {
            var s = await _db.Subjects.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
            if (s is null) return NotFound();

            var dto = new SubjectDto(s.Id, s.Code, s.Name, s.Hours, s.Note);
            return Ok(dto);
        }

        // ========= POST: /api/subjects  (إنشاء) =========
        // الواجهة ترسل أحيانًا { Id: "0", Code, Name, Note } — نتجاهل Id هنا
        [HttpPost]
        [Authorize(Policy = "subjects-curricula.create")]
        public async Task<IActionResult> Create([FromBody] SubjectCreateRequest dto, CancellationToken ct)
        {
            if (dto is null) return BadRequest("Body مطلوب.");
            if (string.IsNullOrWhiteSpace(dto.Code) || string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Code و Name مطلوبة.");

            // منع ازدواجية حسب Code (اختياري)
            var dup = await _db.Subjects.AnyAsync(s => s.Code == dto.Code, ct);
            if (dup) return Conflict(new { code = "DUPLICATE_CODE", message = "هذا الرمز موجود." });

            var entity = new Subject
            {
                Code = dto.Code.Trim(),
                Name = dto.Name.Trim(),
                Hours = dto.Hours,
                Note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note!.Trim()
            };

            _db.Subjects.Add(entity);
            await _db.SaveChangesAsync(ct);

            var result = new SubjectDto(entity.Id, entity.Code, entity.Name, entity.Hours, entity.Note);
            return CreatedAtAction(nameof(GetById), new { id = entity.Id }, result);
        }

        // ========= PUT: /api/subjects/{id} (تحديث) =========
        [HttpPut("{id:int}")]
        [Authorize(Policy = "subjects-curricula.update")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] SubjectUpdateRequest dto, CancellationToken ct)
        {
            if (dto is null) return BadRequest("Body مطلوب.");
            if (string.IsNullOrWhiteSpace(dto.Code) || string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Code و Name مطلوبة.");

            var entity = await _db.Subjects.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity is null) return NotFound();

            // تحقق ازدواجية الرمز لغير نفس السجل
            var dup = await _db.Subjects.AnyAsync(s => s.Id != id && s.Code == dto.Code, ct);
            if (dup) return Conflict(new { code = "DUPLICATE_CODE", message = "هذا الرمز مستخدم في مادة أخرى." });

            entity.Code = dto.Code.Trim();
            entity.Name = dto.Name.Trim();
            entity.Hours = dto.Hours;
            entity.Note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note!.Trim();

            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        // ========= DELETE: /api/subjects/{id} =========
        [HttpDelete("{id:int}")]
        [Authorize(Policy = "subjects-curricula.delete")]
        public async Task<IActionResult> Delete([FromRoute] int id, CancellationToken ct)
        {
            var entity = await _db.Subjects.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity is null) return NotFound();

            _db.Subjects.Remove(entity);
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
