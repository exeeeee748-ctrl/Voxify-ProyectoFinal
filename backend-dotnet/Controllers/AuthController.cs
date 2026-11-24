using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    // --------------------------------------------------------------------------
    // OAuth / OIDC / SSO: DIFERIDO (especificación técnica, sección 1.1).
    // Los endpoints de inicio de sesión con proveedores externos quedan
    // deshabilitados (conservados como comentario) hasta una fase posterior.
    // --------------------------------------------------------------------------

    /*
    [HttpGet("login/twitch")]
    [AllowAnonymous]
    public IActionResult LoginTwitch([FromQuery] string? returnUrl = null)
    {
        var properties = new AuthenticationProperties
        {
            RedirectUri = ResolveReturnUrl(returnUrl)
        };

        return Challenge(properties, "Twitch");
    }

    [HttpGet("login/microsoft")]
    [AllowAnonymous]
    public IActionResult LoginMicrosoft([FromQuery] string? returnUrl = null)
    {
        var properties = new AuthenticationProperties
        {
            RedirectUri = ResolveReturnUrl(returnUrl)
        };

        return Challenge(properties, "Microsoft");
    }

    [HttpGet("login")]
    [AllowAnonymous]
    public IActionResult Login([FromQuery] string? returnUrl = null)
    {
        var target = string.IsNullOrWhiteSpace(returnUrl)
            ? "/api/auth/login/twitch"
            : $"/api/auth/login/twitch?returnUrl={Uri.EscapeDataString(returnUrl)}";
        return Redirect(target);
    }

    private static string ResolveReturnUrl(string? returnUrl)
    {
        var defaultFrontend = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:3000";
        var corsOriginsRaw = Environment.GetEnvironmentVariable("CORS_ORIGINS");
        var allowedOrigins = (string.IsNullOrWhiteSpace(corsOriginsRaw)
                ? new[] { defaultFrontend, "http://localhost:3000", "http://localhost:5174", "http://localhost:8080" }
                : corsOriginsRaw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Select(o => o.TrimEnd('/'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (!string.IsNullOrWhiteSpace(returnUrl))
        {
            if (returnUrl.StartsWith('/') && !returnUrl.StartsWith("//"))
                return returnUrl;

            if (Uri.TryCreate(returnUrl, UriKind.Absolute, out var uri))
            {
                var origin = $"{uri.Scheme}://{uri.Authority}";
                if (allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
                    return returnUrl;
            }
        }

        return defaultFrontend;
    }
    */

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var provider = User.Identities
            .Select(identity => identity.AuthenticationType)
            .FirstOrDefault(type => type is "Twitch" or "Microsoft");

        var roles = User.FindAll(System.Security.Claims.ClaimTypes.Role)
            .Select(c => c.Value)
            .Distinct()
            .ToArray();

        var permisos = User.FindAll(backend_dotnet.Security.VoxifyClaimsTransformation.ClaimPermiso)
            .Select(c => c.Value)
            .Distinct()
            .ToArray();

        return Ok(new
        {
            Autenticado = User.Identity?.IsAuthenticated,
            Nombre = User.Identity?.Name
                ?? User.FindFirst("name")?.Value
                ?? User.FindFirst("preferred_username")?.Value,
            Proveedor = provider,
            Identificador = User.FindFirst(
                System.Security.Claims.ClaimTypes.NameIdentifier
            )?.Value,
            Rol = roles.FirstOrDefault() ?? "Usuario",
            Permisos = permisos
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(
            CookieAuthenticationDefaults.AuthenticationScheme
        );

        return Ok(new { mensaje = "Sesión cerrada correctamente" });
    }
}
