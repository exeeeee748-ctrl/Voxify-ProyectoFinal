using backend_dotnet.Data;
using backend_dotnet.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
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

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Falta ConnectionStrings__DefaultConnection en .env o configuración.");

builder.Services.AddDbContext<VoxifyDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.Configure<TtsOptions>(
    builder.Configuration.GetSection(TtsOptions.SectionName));

builder.Services.AddScoped<IDevUserProvider, DevUserProvider>();

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

// --------------------------------------------------------------------------
// OAuth / OIDC / SSO: DIFERIDO (especificación técnica, sección 1.1).
// No se integra ningún proveedor de identidad externo (Twitch, Microsoft,
// Google, Keycloak, etc.) en esta fase. Se conserva únicamente la
// autenticación por cookie como base temporal para los atributos
// [Authorize] ya existentes, hasta reemplazarla por un usuario local de
// desarrollo.
// --------------------------------------------------------------------------

// Registro de proveedores OAuth deshabilitado. Se deja aquí la referencia
// para habilitarlos en una fase futura:
//
// if (!string.IsNullOrWhiteSpace(twitchClientId) &&
//     !string.IsNullOrWhiteSpace(twitchClientSecret))
// {
//     authenticationBuilder.AddTwitch(options =>
//     {
//         options.ClientId = twitchClientId;
//         options.ClientSecret = twitchClientSecret;
//         options.CallbackPath = twitchCallbackPath;
//         options.SaveTokens = true;
//     });
// }
//
// if (!string.IsNullOrWhiteSpace(microsoftClientId) &&
//     !string.IsNullOrWhiteSpace(microsoftClientSecret))
// {
//     authenticationBuilder.AddMicrosoftAccount(options =>
//     {
//         options.ClientId = microsoftClientId;
//         options.ClientSecret = microsoftClientSecret;
//         options.CallbackPath = microsoftCallbackPath;
//         options.SaveTokens = true;
//     });
// }

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    })
    .AddCookie();

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();