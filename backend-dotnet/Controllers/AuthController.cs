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
    private readonly ISesionUsuarioService _sesiones;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        OAuthProviderSettings providers,
        VoxifyDbContext context,
        IDevUserProvider devUser,
        ISesionUsuarioService sesiones,
        ILogger<AuthController> logger)
    {
        _providers = providers;
        _context = context;
        _devUser = devUser;
        _sesiones = sesiones;
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
            IdSesion = User.FindFirst(VoxifyClaims.IdSesion)?.Value,
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

    [HttpGet("sesiones")]
    [HttpGet("/auth/sesiones")]
    [Authorize]
    public async Task<IActionResult> Sesiones(CancellationToken cancellationToken)
    {
        var idClaim = User.FindFirst(VoxifyClaims.IdUsuario)?.Value;
        if (!int.TryParse(idClaim, out var idUsuario))
            return Unauthorized(new { error = "No hay una sesión de Voxify válida." });

        Guid.TryParse(User.FindFirst(VoxifyClaims.IdSesion)?.Value, out var idSesionActual);

        var sesiones = await _sesiones.ListarPorUsuarioAsync(idUsuario, cancellationToken);
        var now = DateTime.UtcNow;

        return Ok(new
        {
            idUsuario,
            idSesionActual = idSesionActual == Guid.Empty ? (Guid?)null : idSesionActual,
            activas = sesiones.Count(s => s.Activa && s.FechaRevocacion == null && s.FechaExpiracion > now),
            total = sesiones.Count,
            sesiones = sesiones.Select(s => new
            {
                idSesion = s.IdSesion,
                proveedor = s.Proveedor,
                activa = s.Activa && s.FechaRevocacion == null && s.FechaExpiracion > now,
                esActual = idSesionActual != Guid.Empty && s.IdSesion == idSesionActual,
                fechaCreacion = s.FechaCreacion,
                fechaExpiracion = s.FechaExpiracion,
                fechaRevocacion = s.FechaRevocacion,
                motivoRevocacion = s.MotivoRevocacion,
                ipOrigen = s.IpOrigen,
                userAgent = s.UserAgent
            })
        });
    }

    [HttpDelete("sesiones/{idSesion:guid}")]
    [HttpDelete("/auth/sesiones/{idSesion:guid}")]
    [Authorize]
    public async Task<IActionResult> RevocarSesion(
        Guid idSesion,
        CancellationToken cancellationToken)
    {
        var idClaim = User.FindFirst(VoxifyClaims.IdUsuario)?.Value;
        if (!int.TryParse(idClaim, out var idUsuario))
            return Unauthorized(new { error = "No hay una sesión de Voxify válida." });

        var revocada = await _sesiones.RevocarSesionAsync(
            idSesion,
            idUsuario,
            "Revocada desde panel de sesiones",
            cancellationToken);

        if (!revocada)
            return NotFound(new { error = "Sesión no encontrada o ya revocada." });

        var esActual = Guid.TryParse(User.FindFirst(VoxifyClaims.IdSesion)?.Value, out var actual)
            && actual == idSesion;

        if (esActual)
        {
            await HttpContext.SignOutAsync(
                CookieAuthenticationDefaults.AuthenticationScheme);
        }

        _logger.LogInformation(
            "Sesión individual revocada | idUsuario={IdUsuario} | idSesion={IdSesion} | esActual={EsActual}",
            idUsuario,
            idSesion,
            esActual);

        return Ok(new
        {
            mensaje = "Sesión revocada en PostgreSQL.",
            idSesion,
            esActual
        });
    }

    [HttpPost("logout")]
    [HttpPost("/auth/logout")]
    [HttpPost("single-sign-out")]
    [HttpPost("/auth/single-sign-out")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout(
        [FromQuery] string scope = "global",
        CancellationToken cancellationToken = default)
    {
        var esGlobal = !string.Equals(scope, "local", StringComparison.OrdinalIgnoreCase);
        var sesionesRevocadas = 0;

        var idUsuarioRaw = User.FindFirst(VoxifyClaims.IdUsuario)?.Value;
        var idSesionRaw = User.FindFirst(VoxifyClaims.IdSesion)?.Value;

        if (int.TryParse(idUsuarioRaw, out var idUsuario))
        {
            if (esGlobal)
            {
                sesionesRevocadas = await _sesiones.RevocarTodasAsync(
                    idUsuario,
                    "Single Sign-Out global",
                    cancellationToken);

                _logger.LogInformation(
                    "Single Sign-Out ejecutado | idUsuario={IdUsuario} | sesionesRevocadas={Count}",
                    idUsuario,
                    sesionesRevocadas);
            }
            else if (Guid.TryParse(idSesionRaw, out var idSesion))
            {
                var revocada = await _sesiones.RevocarSesionAsync(
                    idSesion,
                    idUsuario,
                    "Cierre de sesión local",
                    cancellationToken);
                sesionesRevocadas = revocada ? 1 : 0;
            }
        }

        await HttpContext.SignOutAsync(
            CookieAuthenticationDefaults.AuthenticationScheme);

        return Ok(new
        {
            mensaje = esGlobal
                ? "Single Sign-Out completado. Todas las sesiones activas fueron revocadas en PostgreSQL."
                : "Sesión local cerrada correctamente.",
            singleSignOut = esGlobal,
            sesionesRevocadas
        });
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
        var sesion = await _sesiones.CrearSesionAsync(
            usuario.IdUsuario,
            "development",
            HttpContext,
            cancellationToken);

        var identity = new ClaimsIdentity(
            CookieAuthenticationDefaults.AuthenticationScheme);

        identity.AddClaim(new Claim(
            VoxifyClaims.IdUsuario,
            usuario.IdUsuario.ToString()));
        identity.AddClaim(new Claim(
            VoxifyClaims.IdSesion,
            sesion.IdSesion.ToString()));
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
