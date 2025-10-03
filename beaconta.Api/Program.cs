using beaconta.Application.Interfaces;
using beaconta.Infrastructure.Data;
using beaconta.Infrastructure.Data.Seed;
using beaconta.Infrastructure.Services;
using beaconta.Domain.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// ================== DbContext ==================
builder.Services.AddDbContext<BeacontaDb>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// ================== Services ==================
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<IMenuRepository, MenuRepository>();
builder.Services.AddScoped<IMenuService, MenuService>();
builder.Services.AddScoped<ISchoolService, SchoolService>(); // 👈 خدمة المدارس
builder.Services.AddScoped<IBranchService, BranchService>();
// ================== Controllers ==================
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        opt.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        opt.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
    opt.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

// ================== Load Permissions -> Policies ==================
List<string> perms;
using (var scope = builder.Services.BuildServiceProvider().CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BeacontaDb>();

    // ✅ Seed
    await MenuSeed.SeedMenuAsync(db);

    // ✅ جلب الصلاحيات
    perms = db.Permissions.AsNoTracking().Select(p => p.Key).ToList();
}

// ✅ أضف كل السياسات مرة واحدة
builder.Services.AddAuthorization(options =>
{
    foreach (var key in perms)
    {
        options.AddPolicy(key, policy =>
            policy.RequireClaim("permissions", key));
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

app.UseDefaultFiles(new DefaultFilesOptions
{
    DefaultFileNames = new List<string> { "login.html" }
});
app.UseStaticFiles();

// ================== Middlewares ==================
//app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("AllowAll");

// Debug Claims
app.Use(async (context, next) =>
{
    if (context.User.Identity?.IsAuthenticated ?? false)
    {
        Console.WriteLine("=== Claims from JWT ===");
        foreach (var claim in context.User.Claims)
        {
            Console.WriteLine($"{claim.Type} = {claim.Value}");
        }
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




//using beaconta.Application.Interfaces;
//using beaconta.Infrastructure.Data;
//using beaconta.Infrastructure.Data.Seed;
//using beaconta.Infrastructure.Services;
//using Microsoft.AspNetCore.Authentication.JwtBearer;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.IdentityModel.Tokens;
//using System.Text;
//using System.Text.Json;
//using System.Text.Json.Serialization;

//var builder = WebApplication.CreateBuilder(args);

//// DbContext
//builder.Services.AddDbContext<BeacontaDb>(options =>
//    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

//// Services
//builder.Services.AddScoped<IAuthService, AuthService>();
//builder.Services.AddScoped<IUserService, UserService>();
//builder.Services.AddHttpContextAccessor();
//builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
//builder.Services.AddScoped<IRoleService, RoleService>();
//builder.Services.AddScoped<IPermissionService, PermissionService>();
//builder.Services.AddMemoryCache();
//builder.Services.AddScoped<IMenuRepository, MenuRepository>();
//builder.Services.AddScoped<IMenuService, MenuService>();

//// Controllers + JSON options
//builder.Services.AddControllers()
//    .AddJsonOptions(opt =>
//    {
//        // الاستجابات تظل camelCase
//        opt.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
//        opt.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;

//        // السماح بقراءة الحقول سواء Username أو username
//        opt.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
//    });

//builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSwaggerGen();

//// JWT
//var jwt = builder.Configuration.GetSection("Jwt");
//builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//    .AddJwtBearer(o =>
//    {
//        o.TokenValidationParameters = new TokenValidationParameters
//        {
//            ValidateIssuer = true,
//            ValidateAudience = true,
//            ValidateLifetime = true,
//            ValidateIssuerSigningKey = true,
//            ValidIssuer = jwt["Issuer"],
//            ValidAudience = jwt["Audience"],
//            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!)),
//            RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
//        };

//        // 🔎 Debug لأسباب الرفض
//        o.Events = new JwtBearerEvents
//        {
//            OnAuthenticationFailed = ctx =>
//            {
//                Console.WriteLine("JWT Error: " + ctx.Exception.Message);
//                return Task.CompletedTask;
//            },
//            OnChallenge = ctx =>
//            {
//                Console.WriteLine("JWT Challenge: " + ctx.ErrorDescription);
//                return Task.CompletedTask;
//            }
//        };
//    });



//// CORS
//builder.Services.AddCors(opt =>
//{
//    opt.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
//});

//var app = builder.Build();

//// Seed
//using (var scope = app.Services.CreateScope())
//{
//    var db = scope.ServiceProvider.GetRequiredService<BeacontaDb>();
//    await MenuSeed.SeedMenuAsync(db);
//}

//// Swagger على /swagger فقط
//app.UseSwagger();
//app.UseSwaggerUI(c =>
//{
//    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Beaconta API v1");
//    c.RoutePrefix = "swagger";
//});

//// ⚠️ تأكد أن login.html موجود فعليًا داخل wwwroot/
//// إعادة توجيه الجذر "/" دائمًا إلى login.html
//app.MapGet("/", () => Results.Redirect("/login.html"));

//// ملفات ثابتة + ملفات افتراضية
//app.UseDefaultFiles(new DefaultFilesOptions
//{
//    DefaultFileNames = new List<string> { "login.html" }
//});
//app.UseStaticFiles();

////app.UseHttpsRedirection();

//app.UseRouting();

//app.UseCors("AllowAll");
//app.Use(async (context, next) =>
//{
//    if (context.User.Identity?.IsAuthenticated ?? false)
//    {
//        Console.WriteLine("=== Claims from JWT ===");
//        foreach (var claim in context.User.Claims)
//        {
//            Console.WriteLine($"{claim.Type} = {claim.Value}");
//        }
//    }
//    else
//    {
//        Console.WriteLine("=== No User Authenticated ===");
//    }

//    await next();
//});


//app.UseAuthentication();
//app.UseAuthorization();

//app.MapControllers();

//app.Run();
