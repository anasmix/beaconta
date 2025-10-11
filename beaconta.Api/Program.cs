// Program.cs
using AutoMapper; 
using beaconta.Api.Validators;
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Application.Mapping;
using beaconta.Application.Services;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using beaconta.Infrastructure.Data.Seed;
using beaconta.Infrastructure.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

// ===================================================
// Builder
// ===================================================
var builder = WebApplication.CreateBuilder(args);

// ================== DbContext ==================
builder.Services.AddDbContext<BeacontaDb>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// ================== Application Services ==================
builder.Services.AddHttpContextAccessor();
builder.Services.AddMemoryCache();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IMenuRepository, MenuRepository>();
builder.Services.AddScoped<IMenuService, MenuService>();
builder.Services.AddScoped<ISchoolService, SchoolService>();
builder.Services.AddScoped<IBranchService, BranchService>();
builder.Services.AddScoped<IStageService, StageService>();
builder.Services.AddScoped<ISubjectsService, SubjectsService>();
builder.Services.AddScoped<IFeesService, FeesService>();
builder.Services.AddScoped<IFeesLinksService, FeesLinksService>();
builder.Services.AddScoped<IGradeYearService, GradeYearService>();
builder.Services.AddScoped<ISectionYearService, SectionYearService>();
builder.Services.AddScoped<ITermYearService, TermYearService>();
builder.Services.AddScoped<ICalendarEventService, CalendarEventService>();
builder.Services.AddScoped<IFeeBundlesService, FeeBundlesService>();

// ================== AutoMapper ==================
builder.Services.AddAutoMapper(typeof(MappingProfile).Assembly);

// ================== FluentValidation ==================
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<GradeYearUpsertValidator>(ServiceLifetime.Transient);
builder.Services.AddValidatorsFromAssemblyContaining<SectionYearUpsertValidator>(ServiceLifetime.Transient);
builder.Services.AddValidatorsFromAssemblyContaining<TermYearUpsertValidator>(ServiceLifetime.Transient);
builder.Services.AddValidatorsFromAssemblyContaining<CalendarEventUpsertValidator>(ServiceLifetime.Transient);
builder.Services.AddValidatorsFromAssemblyContaining<CurriculumTemplateCreateValidator>(ServiceLifetime.Transient);

builder.Services.AddTransient<IValidator<SectionYearUpsertDto>, SectionYearUpsertValidator>();

// ================== Controllers & JSON ==================
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        opt.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        opt.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// ================== Swagger + JWT Support ==================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Beaconta API", Version = "v1" });
    var jwtScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Enter JWT as: Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
    };
    c.AddSecurityDefinition("Bearer", jwtScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { [jwtScheme] = new List<string>() });
});

// ================== JWT ==================
JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

var jwt = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!)),
            RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        };
        o.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = ctx => { Console.WriteLine("JWT Error: " + ctx.Exception.Message); return Task.CompletedTask; },
            OnChallenge = ctx => { Console.WriteLine("JWT Challenge: " + ctx.ErrorDescription); return Task.CompletedTask; }
        };
    });

// ================== CORS ==================
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

// ===================================================
// Seed permissions BEFORE AddAuthorization
// ===================================================
List<string> allPermissionKeys;
using (var scope = builder.Services.BuildServiceProvider().CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BeacontaDb>();

    await MenuSeed.SeedMenuAsync(db);

    string[] gradePerms = { "grades.view", "grades.create", "grades.update", "grades.delete", "grades.export" };
    foreach (var key in gradePerms)
        if (!await db.Permissions.AnyAsync(p => p.Key == key))
            db.Permissions.Add(new Permission { Key = key, Name = key, Category = "Academic", CreatedBy = "system" });

    string[] curriculaPerms =
    {
        "curricula.manage",
        "curricula.templates.create",
        "curricula.templates.update",
        "curricula.templates.delete",
        "curricula.templates.view"
    };
    foreach (var key in curriculaPerms)
        if (!await db.Permissions.AnyAsync(p => p.Key == key))
            db.Permissions.Add(new Permission { Key = key, Name = key, Category = "Academic", CreatedBy = "system" });

    await db.SaveChangesAsync();

    allPermissionKeys = await db.Permissions.AsNoTracking()
        .Select(p => p.Key)
        .ToListAsync();
}

// ================== Authorization ==================
// يقرأ: permissions (claim متعددة أو JSON Array أو نص بفواصل) + perm (قديم) + يتجاوز للأدمِن
static bool HasPerm(ClaimsPrincipal user, params string[] anyOf)
{
    if (user.IsInRole("admin") || user.IsInRole("Admin")) return true;

    var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

    // permissions claims (قد تكون عناصر متعددة أو Array واحدة أو CSV)
    foreach (var c in user.FindAll("permissions"))
    {
        var v = c.Value?.Trim();
        if (string.IsNullOrEmpty(v)) continue;

        if (v.StartsWith("[") && v.EndsWith("]"))
        {
            try
            {
                var arr = JsonSerializer.Deserialize<string[]>(v);
                if (arr != null) foreach (var p in arr) if (!string.IsNullOrWhiteSpace(p)) set.Add(p.Trim());
            }
            catch { /* ignore */ }
        }
        else if (v.Contains(','))
        {
            foreach (var p in v.Split(',', StringSplitOptions.RemoveEmptyEntries))
                set.Add(p.Trim());
        }
        else
        {
            set.Add(v);
        }
    }

    // perm (قديم)
    foreach (var c in user.FindAll("perm"))
        if (!string.IsNullOrWhiteSpace(c.Value)) set.Add(c.Value.Trim());

    return anyOf.Any(p => set.Contains(p));
}

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("fees.catalog.view", policy =>
    policy.RequireAssertion(ctx => HasPerm(ctx.User, "fees.view", "fees.catalog.view", "finance-link")));

    // أمثلة عامة
    options.AddPolicy("grades.view", p => p.RequireAssertion(ctx => HasPerm(ctx.User, "grades.view")));
    options.AddPolicy("grades.update", p => p.RequireAssertion(ctx => HasPerm(ctx.User, "grades.update")));
    options.AddPolicy("fees.bundles.manage", policy =>
     policy.RequireAssertion(ctx => HasPerm(ctx.User,
         "fees.bundles.manage",  // لو أضفتها في جدول Permissions
         "finance-link",         // إن أردت السماح لهذا المفتاح أيضًا
         "link-fees-curricula"   // أو نفس مفتاح شاشة الربط
     )));
    // Terms / Calendar
    options.AddPolicy("terms.view", p => p.RequireAssertion(ctx => HasPerm(ctx.User, "terms.view", "terms-calendar")));
    options.AddPolicy("terms.manage", p => p.RequireAssertion(ctx => HasPerm(ctx.User, "terms.manage", "terms-calendar")));
    options.AddPolicy("calendar.view", p => p.RequireAssertion(ctx => HasPerm(ctx.User, "calendar.view", "terms-calendar")));
    options.AddPolicy("calendar.manage", p => p.RequireAssertion(ctx => HasPerm(ctx.User, "calendar.manage", "terms-calendar")));

    // School Years
    options.AddPolicy("schoolyears.view", p => p.RequireAssertion(ctx => HasPerm(ctx.User, "schoolyears.view")));
    options.AddPolicy("schoolyears.manage", p => p.RequireAssertion(ctx => HasPerm(ctx.User, "schoolyears.manage")));

    // Fees / Links
    options.AddPolicy("fees.links.view", p => p.RequireAssertion(ctx => HasPerm(ctx.User, "feeslinks.view", "finance-link", "link-fees-curricula")));
    options.AddPolicy("fees.links.manage", p => p.RequireAssertion(ctx => HasPerm(ctx.User, "feeslinks.create", "feeslinks.update", "feeslinks.delete", "finance-link", "link-fees-curricula")));
    options.AddPolicy("fees.catalog.view", p => p.RequireAssertion(ctx => HasPerm(ctx.User, "fees.view", "fees.catalog.view", "finance-link")));

    // ✅ المناهج (يشمل مفاتيح بديلة وقديمة)
    options.AddPolicy("curricula.manage", p => p.RequireAssertion(ctx => HasPerm(ctx.User,
        "curricula.manage",
        "curricula.templates.create", "curricula.templates.update", "curricula.templates.delete",
        "subjects-curricula.create", "subjects-curricula.update", "subjects-curricula.delete",
        "link-fees-curricula"
    )));

    options.AddPolicy("curricula.templates.create", p => p.RequireAssertion(ctx => HasPerm(ctx.User,
        "curricula.templates.create", "curricula.manage", "subjects-curricula.create")));

    // سياسات ديناميكية من جدول Permissions (منع تكرار)
    foreach (var key in allPermissionKeys.Distinct(StringComparer.OrdinalIgnoreCase))
    {
        if (!options.GetPolicyNames().Contains(key, StringComparer.OrdinalIgnoreCase))
            options.AddPolicy(key, p => p.RequireAssertion(ctx => HasPerm(ctx.User, key)));
    }
});

// ================== Build ==================
var app = builder.Build();

// ================== Swagger ==================
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Beaconta API v1");
    c.RoutePrefix = "swagger";
});

// ================== Static Files ==================
app.MapGet("/", () => Results.Redirect("/login.html"));
app.UseDefaultFiles(new DefaultFilesOptions { DefaultFileNames = new List<string> { "login.html" } });
app.UseStaticFiles();

// ================== Middlewares ==================
app.UseRouting();
app.UseCors("AllowAll");

// تشخيص: اطبع الـClaims وسياسات القرار
app.Use(async (context, next) =>
{
    Console.WriteLine(context.User?.Identity?.IsAuthenticated == true ? "=== Authenticated ===" : "=== Anonymous ===");

    if (context.User?.Identity?.IsAuthenticated == true)
    {
        foreach (var c in context.User.Claims)
            Console.WriteLine($"CLAIM => {c.Type} = {c.Value}");
    }
    await next();
});

app.UseAuthentication();
app.UseAuthorization();

// Endpoint تشخيصي سريع لمعرفة السماح بمنشأ المناهج
app.MapGet("/debug/curricula-manage", (ClaimsPrincipal user) =>
{
    var ok = HasPerm(user,
        "curricula.manage",
        "curricula.templates.create", "curricula.templates.update", "curricula.templates.delete",
        "subjects-curricula.create", "subjects-curricula.update", "subjects-curricula.delete",
        "link-fees-curricula"
    );
    return Results.Json(new { canManageCurricula = ok });
}).RequireAuthorization();

// ================== Controllers ==================
app.MapControllers();

// ================== Run ==================
app.Run();

// ===== Helper extension =====
internal static class AuthorizationOptionsExtensions
{
    public static IEnumerable<string> GetPolicyNames(this Microsoft.AspNetCore.Authorization.AuthorizationOptions opts)
        => opts.GetType()
               .GetProperty("PolicyMap", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?
               .GetValue(opts) is IDictionary<string, object> map
                    ? map.Keys
                    : Array.Empty<string>();
}
