// Program.cs
using AutoMapper;
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;       // ✅ IGradeYearService
using beaconta.Application.Mapping; // أو namespace الـProfile عندك
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using beaconta.Infrastructure.Data.Seed; 
using beaconta.Infrastructure.Services;         // ✅ GradeYearService
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
 
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// ================== DbContext ==================
builder.Services.AddDbContext<BeacontaDb>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// ================== AutoMapper ==================
builder.Services.AddScoped<IGradeYearService, GradeYearService>();

// ================== Application Services ==================
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<IMenuRepository, MenuRepository>();
builder.Services.AddScoped<IMenuService, MenuService>();
builder.Services.AddScoped<ISchoolService, SchoolService>();
builder.Services.AddScoped<IBranchService, BranchService>();
builder.Services.AddScoped<IStageService, StageService>();

// Program.cs (منطقة تسجيل الخدمات)
 
// FluentValidation (إن كنت تستخدمه)
builder.Services.AddScoped<IValidator<SectionYearUpsertDto>, SectionYearUpsertValidator>();
// وإن كنت تريد التفعيل التلقائي:
builder.Services.AddFluentValidationAutoValidation();


// إن كنت تستخدم FluentValidation بالتجميع:
builder.Services.AddTransient<IValidator<SectionYearUpsertDto>, SectionYearUpsertValidator>();

// EF DbContext الموجود لديك
// builder.Services.AddDbContext<BeacontaDb>(...);

// AutoMapper (لو لم يكن مُسجلاً)
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<GradeYearUpsertValidator>(ServiceLifetime.Transient);
builder.Services.AddValidatorsFromAssemblyContaining<SectionYearUpsertValidator>(ServiceLifetime.Transient);

// في حال تحب التسجيل اليدوي أيضًا (اختياري ولا يتعارض):
builder.Services.AddTransient<IValidator<SectionYearUpsertDto>, SectionYearUpsertValidator>();

// خدمات الدومين/الأعمال
builder.Services.AddScoped<IGradeYearService, GradeYearService>();

// باقي خدماتك كما هي...
builder.Services.AddScoped<ISectionYearService, SectionYearService>();

// ================== Controllers & JSON ==================
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        opt.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        opt.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("grades.view", p => p.RequireClaim("permissions", "grades.view"));
    options.AddPolicy("grades.update", p => p.RequireClaim("permissions", "grades.update"));
});

builder.Services.AddAutoMapper(typeof(MappingProfile).Assembly);

builder.Services.AddEndpointsApiExplorer();

// ================== Swagger + JWT Support ==================
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
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [jwtScheme] = new List<string>()
    });
});

// AutoMapper: امسح كل محاولات تسجيل قديمة، واستخدم هذه
//builder.Services.AddAutoMapper(typeof(beaconta.Application.Mapping.MappingProfile).Assembly);

// ================== JWT ==================
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
            OnAuthenticationFailed = ctx =>
            {
                Console.WriteLine("JWT Error: " + ctx.Exception.Message);
                return Task.CompletedTask;
            },
            OnChallenge = ctx =>
            {
                Console.WriteLine("JWT Challenge: " + ctx.ErrorDescription);
                return Task.CompletedTask;
            }
        };
    });

// ================== CORS ==================
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowAll", p => p
        .AllowAnyOrigin()
        .AllowAnyHeader()
        .AllowAnyMethod());
});

// ================== Seed + Policies ==================
// ملاحظة: نكوّن ServiceProvider مؤقت فقط للسيد، بعدها نولّد السياسات من جدول Permissions
List<string> perms;
using (var scope = builder.Services.BuildServiceProvider().CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BeacontaDb>();

    // ✅ Seed القائمة + الصلاحيات المرتبطة (ستُنشئ Permissions لو ناقصة)
    await MenuSeed.SeedMenuAsync(db);

    // تأكد أن صلاحيات "grades.*" موجودة؛ إن ما كانت، أضفها هنا كحد أدنى:
    string[] gradePerms = new[] { "grades.view", "grades.create", "grades.update", "grades.delete", "grades.export" };
    foreach (var key in gradePerms)
    {
        if (!await db.Permissions.AnyAsync(p => p.Key == key))
        {
            db.Permissions.Add(new Permission { Key = key, Name = key, Category = "Academic", CreatedBy = "system" });
        }
    }
    await db.SaveChangesAsync();

    // ✅ اجلب كل المفاتيح لتعريف السياسات
    perms = await db.Permissions.AsNoTracking().Select(p => p.Key).ToListAsync();
}

// أضف كل السياسات بناءً على جدول Permissions
builder.Services.AddAuthorization(options =>
{
    foreach (var key in perms)
        options.AddPolicy(key, policy => policy.RequireClaim("permissions", key));
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
app.UseDefaultFiles(new DefaultFilesOptions
{
    DefaultFileNames = new List<string> { "login.html" }
});
app.UseStaticFiles();

// ================== Middlewares ==================
app.UseRouting();
app.UseCors("AllowAll");

// Debug Claims (للتشخيص فقط أثناء التطوير)
app.Use(async (context, next) =>
{
    if (context.User.Identity?.IsAuthenticated ?? false)
    {
        Console.WriteLine("=== Claims from JWT ===");
        foreach (var claim in context.User.Claims)
            Console.WriteLine($"{claim.Type} = {claim.Value}");
    }
    else
    {
        Console.WriteLine("=== No User Authenticated ===");
    }
    await next();
});

app.UseAuthentication();
app.UseAuthorization();

// ================== Controllers ==================
app.MapControllers();

// ================== Run ==================
app.Run();
