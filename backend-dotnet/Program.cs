using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.MicrosoftAccount;
using AspNet.Security.OAuth.Twitch;
using backend_dotnet.Data;
using backend_dotnet.Security;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddControllers();

var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:3000";
var corsOriginsRaw = Environment.GetEnvironmentVariable("CORS_ORIGINS");
var allowedOrigins = (string.IsNullOrWhiteSpace(corsOriginsRaw)
        ? new[] { frontendUrl, "http://localhost:3000", "http://localhost:5174", "http://localhost:8080" }
        : corsOriginsRaw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("VoxifyFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddDbContext<VoxifyDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
        ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ));

// Autenticación
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
})
.AddCookie(options =>
{
    options.Cookie.Name = "Voxify.Auth";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Events.OnRedirectToLogin = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            return context.Response.WriteAsync("{\"error\":\"No autenticado. Inicia sesión para acceder a este recurso.\"}");
        }
        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            return context.Response.WriteAsync("{\"error\":\"Acceso denegado. No tienes permisos suficientes para este recurso.\"}");
        }
        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };
})
.AddTwitch(options =>
{
    options.ClientId = Environment.GetEnvironmentVariable("TWITCH_CLIENT_ID") ?? "";
    options.ClientSecret = Environment.GetEnvironmentVariable("TWITCH_CLIENT_SECRET") ?? "";
    options.CallbackPath = "/signin-twitch";
    options.SaveTokens = true;
})
.AddMicrosoftAccount(options =>
{
    options.ClientId = Environment.GetEnvironmentVariable("MICROSOFT_CLIENT_ID") ?? "";
    options.ClientSecret = Environment.GetEnvironmentVariable("MICROSOFT_CLIENT_SECRET") ?? "";
    options.CallbackPath = "/signin-microsoft";
    options.SaveTokens = true;
});
builder.Services.AddTransient<IClaimsTransformation, VoxifyClaimsTransformation>();

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ReporteProduccionAudios", policy =>
        policy.RequireAuthenticatedUser()
            .RequireRole(VoxifyClaimsTransformation.RoleAnalistaReportes)
            .RequireClaim(
                VoxifyClaimsTransformation.ClaimPermiso,
                VoxifyClaimsTransformation.PermisoLeerReporteProduccion
            ));
});

var app = builder.Build();

if (string.Equals(Environment.GetEnvironmentVariable("AUTO_MIGRATE"), "true", StringComparison.OrdinalIgnoreCase))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<VoxifyDbContext>();
    for (var intento = 1; intento <= 5; intento++)
    {
        try
        {
            db.Database.Migrate();
            break;
        }
        catch (Exception ex) when (intento < 5)
        {
            Console.WriteLine($"[Voxify] Esperando PostgreSQL para migraciones (intento {intento}/5): {ex.Message}");
            Thread.Sleep(2000);
        }
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!string.Equals(Environment.GetEnvironmentVariable("DISABLE_HTTPS_REDIRECTION"), "true", StringComparison.OrdinalIgnoreCase))
{
    app.UseHttpsRedirection();
}

app.UseCors("VoxifyFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", async (VoxifyDbContext db) =>
{
    var conectado = await db.Database.CanConnectAsync();
    if (!conectado)
    {
        return Results.Problem(
            title: "Base de datos no disponible",
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }

    var conteos = new
    {
        idiomas = await db.Idiomas.CountAsync(),
        solicitudesGeneracion = await db.SolicitudesGeneracion.CountAsync(),
        audios = await db.Audios.CountAsync(),
        historialAudios = await db.HistorialAudios.CountAsync()
    };

    return Results.Ok(new
    {
        status = "ok",
        database = "connected",
        tablas = conteos
    });
}).AllowAnonymous();

app.MapControllers();

app.Run();
