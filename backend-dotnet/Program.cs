using backend_dotnet.Data;
using backend_dotnet.Security;
using backend_dotnet.Security.TikTok;
using backend_dotnet.Services;
using backend_dotnet.Services.OAuth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OAuth.Claims;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Scalar.AspNetCore;

var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (File.Exists(envPath))
{
    foreach (var rawLine in File.ReadAllLines(envPath))
    {
        var line = rawLine.Trim();
        if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
            continue;

        var idx = line.IndexOf('=');
        if (idx <= 0)
            continue;

        var key = line[..idx].Trim();
        var value = line[(idx + 1)..].Trim().Trim('"').Trim('\'');

        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
        {
            Environment.SetEnvironmentVariable(key, value);
        }
    }
}

var builder = WebApplication.CreateBuilder(args);

var appSecret = Environment.GetEnvironmentVariable("APP_SECRET_KEY");
if (!builder.Environment.IsDevelopment() && string.IsNullOrWhiteSpace(appSecret))
{
    throw new InvalidOperationException(
        "Falta APP_SECRET_KEY. Configúrala en .env o en los secretos del entorno.");
}

// La cookie de sesión se cifra con ASP.NET Core Data Protection (claves
// persistidas en Storage/keys), el mecanismo recomendado por el framework.
// APP_SECRET_KEY se exige en producción como secreto de aplicación; la
// rotación de las claves de Data Protection invalida las sesiones activas.

builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();

var keysPath = Path.Combine(
    builder.Environment.ContentRootPath,
    "Storage",
    "keys");
Directory.CreateDirectory(keysPath);

builder.Services
    .AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(keysPath))
    .SetApplicationName("Voxify");

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto |
        ForwardedHeaders.XForwardedHost;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL")
    ?? "http://localhost:3000";
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

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? throw new InvalidOperationException(
        "Falta ConnectionStrings__DefaultConnection en .env o configuración.");

builder.Services.AddDbContext<VoxifyDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.Configure<TtsOptions>(
    builder.Configuration.GetSection(TtsOptions.SectionName));

builder.Services.AddScoped<IDevUserProvider, DevUserProvider>();
builder.Services.AddScoped<ICurrentUserProvider, CurrentUserProvider>();
builder.Services.AddScoped<IUsuarioOAuthService, UsuarioOAuthService>();

builder.Services.AddHttpClient<ITtsService, TtsService>((serviceProvider, client) =>
{
    var options = serviceProvider.GetRequiredService<IOptions<TtsOptions>>().Value;
    var baseUrl = string.IsNullOrWhiteSpace(options.BaseUrl)
        ? "http://localhost:8000"
        : options.BaseUrl.TrimEnd('/') + "/";

    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(
        options.TimeoutSeconds > 0 ? options.TimeoutSeconds : 120);
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

var oauthSettings = OAuthProviderSettings.FromEnvironment(
    builder.Environment.IsDevelopment());
builder.Services.AddSingleton(oauthSettings);

var cookieSameSite = string.Equals(
    Environment.GetEnvironmentVariable("COOKIE_SAME_SITE"),
    "None",
    StringComparison.OrdinalIgnoreCase)
    ? SameSiteMode.None
    : SameSiteMode.Lax;

var cookieSecurePolicy = !builder.Environment.IsDevelopment() ||
    cookieSameSite == SameSiteMode.None ||
    string.Equals(
        Environment.GetEnvironmentVariable("COOKIE_SECURE"),
        "Always",
        StringComparison.OrdinalIgnoreCase)
    ? CookieSecurePolicy.Always
    : CookieSecurePolicy.SameAsRequest;

var authenticationBuilder = builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    })
    .AddCookie(options =>
    {
        options.Cookie.Name = "Voxify.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = cookieSameSite;
        options.Cookie.SecurePolicy = cookieSecurePolicy;
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.SlidingExpiration = true;

        options.Events.OnRedirectToLogin = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api") ||
                context.Request.Path.StartsWithSegments("/auth"))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                return context.Response.WriteAsync(
                    "{\"error\":\"No autenticado. Inicia sesión para acceder a este recurso.\"}");
            }

            context.Response.Redirect(context.RedirectUri);
            return Task.CompletedTask;
        };

        options.Events.OnRedirectToAccessDenied = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api") ||
                context.Request.Path.StartsWithSegments("/auth"))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                return context.Response.WriteAsync(
                    "{\"error\":\"Acceso denegado. No tienes permisos suficientes para este recurso.\"}");
            }

            context.Response.Redirect(context.RedirectUri);
            return Task.CompletedTask;
        };
    });

if (oauthSettings.TikTok.IsConfigured)
{
    authenticationBuilder.AddTikTok(options =>
    {
        options.ClientId = oauthSettings.TikTok.ClientId!;
        options.ClientSecret = oauthSettings.TikTok.ClientSecret!;
        options.CallbackPath = new PathString(oauthSettings.TikTok.CallbackPath);
        options.SaveTokens = true;
        options.Events.OnTicketReceived = OAuthTicketHandler.HandleTicketReceived;
        options.Events.OnRemoteFailure = OAuthTicketHandler.HandleRemoteFailure;
    });
}

if (oauthSettings.Microsoft.IsConfigured)
{
    authenticationBuilder.AddMicrosoftAccount(options =>
    {
        options.ClientId = oauthSettings.Microsoft.ClientId!;
        options.ClientSecret = oauthSettings.Microsoft.ClientSecret!;
        options.CallbackPath = new PathString(oauthSettings.Microsoft.CallbackPath);
        options.SaveTokens = true;
        options.Scope.Clear();
        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.Scope.Add("email");
        options.Scope.Add("User.Read");
        options.ClaimActions.MapJsonKey("userPrincipalName", "userPrincipalName");

        var tenant = string.IsNullOrWhiteSpace(oauthSettings.MicrosoftTenantId)
            ? "common"
            : oauthSettings.MicrosoftTenantId;

        options.AuthorizationEndpoint =
            $"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize";
        options.TokenEndpoint =
            $"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token";
        options.Events.OnTicketReceived = OAuthTicketHandler.HandleTicketReceived;
        options.Events.OnRemoteFailure = OAuthTicketHandler.HandleRemoteFailure;
    });
}

if (oauthSettings.Twitch.IsConfigured)
{
    authenticationBuilder.AddTwitch(options =>
    {
        options.ClientId = oauthSettings.Twitch.ClientId!;
        options.ClientSecret = oauthSettings.Twitch.ClientSecret!;
        options.CallbackPath = new PathString(oauthSettings.Twitch.CallbackPath);
        options.SaveTokens = true;
        options.UsePkce = true;
        options.Scope.Clear();
        options.Scope.Add("openid");
        options.Scope.Add("user:read:email");
        options.Events.OnTicketReceived = OAuthTicketHandler.HandleTicketReceived;
        options.Events.OnRemoteFailure = OAuthTicketHandler.HandleRemoteFailure;
    });
}

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
    app.MapScalarApiReference();
}

app.UseForwardedHeaders();

if (!string.Equals(
        Environment.GetEnvironmentVariable("DISABLE_HTTPS_REDIRECTION"),
        "true",
        StringComparison.OrdinalIgnoreCase))
{
    app.UseHttpsRedirection();
}

app.UseCors("VoxifyFrontend");

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (UnauthorizedAccessException)
    {
        if (!context.Response.HasStarted)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                error = "No autenticado. Inicia sesión para acceder a este recurso."
            });
        }
    }
});

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
