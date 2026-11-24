using System.Security.Claims;
using backend_dotnet.Data;
using backend_dotnet.Models;
using backend_dotnet.Security;
using backend_dotnet.Services;
using backend_dotnet.Services.OAuth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly OAuthProviderSettings _providers;
    private readonly VoxifyDbContext _context;
    private readonly IDevUserProvider _devUser;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        OAuthProviderSettings providers,
        VoxifyDbContext context,
        IDevUserProvider devUser,
        ILogger<AuthController> logger)
    {
        _providers = providers;
        _context = context;
        _devUser = devUser;
        _logger = logger;
    }

    [HttpGet("providers")]
    [HttpGet("/auth/providers")]
    [AllowAnonymous]
    public IActionResult Providers()
    {
        return Ok(new
        {
            devLoginEnabled = _providers.DevLoginEnabled,
            providers = _providers.All.Select(provider => new
            {
                id = provider.Id,
                name = provider.Name,
                configured = provider.IsConfigured,
                loginUrl = provider.LoginPath,
                redirectUri = provider.RedirectUri
            })
        });
    }

    [HttpGet("login/{provider}")]
    [HttpGet("/auth/{provider}/login")]
    [AllowAnonymous]
    public IActionResult Login(
        string provider,
        [FromQuery] string? returnUrl = null)
    {
        var definition = _providers.Find(provider);

        if (definition is null)
        {
            return NotFound(new
            {
                error = $"El proveedor '{provider}' no está soportado."
            });
        }

        if (!definition.IsConfigured)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                error =
                    $"El proveedor {definition.Name} no está configurado. " +
                    "Define sus credenciales en las variables de entorno del backend."
            });
        }

        var properties = new AuthenticationProperties
        {
            RedirectUri = ResolveReturnUrl(returnUrl)
        };

        return Challenge(properties, definition.Scheme);
    }

    [HttpGet("me")]
    [HttpGet("/auth/me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var idClaim = User.FindFirst(VoxifyClaims.IdUsuario)?.Value;
        if (!int.TryParse(idClaim, out var idUsuario))
            return Unauthorized(new { error = "No hay una sesión de Voxify válida." });

        var usuario = await _context.Usuarios
            .AsNoTracking()
            .Include(u => u.CuentasExternas)
            .FirstOrDefaultAsync(u => u.IdUsuario == idUsuario, cancellationToken);

        if (usuario is null || usuario.Estado != EstadoUsuario.Activo)
            return Unauthorized(new { error = "El usuario de la sesión no está disponible." });

        var proveedor = User.FindFirst(VoxifyClaims.Proveedor)?.Value
            ?? User.Identities
                .Select(identity => identity.AuthenticationType)
                .FirstOrDefault(type => type is "Twitch" or "Microsoft" or "TikTok")
            ?? "voxify";

        var roles = User.FindAll(ClaimTypes.Role)
            .Select(claim => claim.Value)
            .Distinct()
            .ToArray();

        var permisos = User.FindAll(VoxifyClaimsTransformation.ClaimPermiso)
            .Select(claim => claim.Value)
            .Distinct()
            .ToArray();

        return Ok(new
        {
            Autenticado = true,
            IdUsuario = usuario.IdUsuario,
            Nombre = usuario.Nombre,
            Correo = usuario.Correo,
            AvatarUrl = usuario.AvatarUrl,
            Estado = usuario.Estado.ToString(),
            Proveedor = proveedor,
            Proveedores = usuario.CuentasExternas
                .Select(cuenta => cuenta.Proveedor)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray(),
            Identificador = $"#{usuario.IdUsuario}",
            Rol = roles.FirstOrDefault() ?? "Usuario",
            Permisos = permisos
        });
    }

    [HttpPost("logout")]
    [HttpPost("/auth/logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(
            CookieAuthenticationDefaults.AuthenticationScheme);

        return Ok(new { mensaje = "Sesión cerrada correctamente" });
    }

    [HttpPost("dev-login")]
    [HttpPost("/auth/dev-login")]
    [AllowAnonymous]
    public async Task<IActionResult> DevLogin(CancellationToken cancellationToken)
    {
        if (!_providers.DevLoginEnabled)
        {
            return NotFound(new
            {
                error = "El acceso de desarrollo está deshabilitado en este entorno."
            });
        }

        var usuario = await _devUser.ObtenerAsync(cancellationToken);

        var identity = new ClaimsIdentity(
            CookieAuthenticationDefaults.AuthenticationScheme);

        identity.AddClaim(new Claim(
            VoxifyClaims.IdUsuario,
            usuario.IdUsuario.ToString()));
        identity.AddClaim(new Claim(ClaimTypes.Name, usuario.Nombre));
        identity.AddClaim(new Claim(VoxifyClaims.Proveedor, "development"));

        if (!string.IsNullOrWhiteSpace(usuario.Correo))
            identity.AddClaim(new Claim(ClaimTypes.Email, usuario.Correo));

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7)
            });

        _logger.LogInformation(
            "Sesión de desarrollo iniciada | idUsuario={IdUsuario}",
            usuario.IdUsuario);

        return Ok(new
        {
            idUsuario = usuario.IdUsuario,
            nombre = usuario.Nombre,
            correo = usuario.Correo,
            estado = usuario.Estado.ToString()
        });
    }

    private string ResolveReturnUrl(string? returnUrl)
    {
        var frontend = _providers.FrontendUrl;
        var allowedOrigins = new List<string> { frontend };

        var corsOrigins = Environment.GetEnvironmentVariable("CORS_ORIGINS");
        if (!string.IsNullOrWhiteSpace(corsOrigins))
        {
            allowedOrigins.AddRange(
                corsOrigins.Split(
                    ',',
                    StringSplitOptions.RemoveEmptyEntries |
                    StringSplitOptions.TrimEntries));
        }

        allowedOrigins.Add("http://localhost:3000");
        allowedOrigins.Add("http://localhost:5174");
        allowedOrigins.Add("http://localhost:8080");

        if (!string.IsNullOrWhiteSpace(returnUrl))
        {
            if (returnUrl.StartsWith('/') && !returnUrl.StartsWith("//"))
                return $"{frontend}{returnUrl}";

            if (Uri.TryCreate(returnUrl, UriKind.Absolute, out var uri))
            {
                var origin = $"{uri.Scheme}://{uri.Authority}";
                var allowed = allowedOrigins.Any(item =>
                    string.Equals(
                        item.TrimEnd('/'),
                        origin,
                        StringComparison.OrdinalIgnoreCase));

                if (allowed)
                    return returnUrl;
            }
        }

        return $"{frontend}/estudio";
    }
}
