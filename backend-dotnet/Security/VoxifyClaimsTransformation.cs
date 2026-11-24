using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;

namespace backend_dotnet.Security;

public class VoxifyClaimsTransformation : IClaimsTransformation
{
    public const string RoleAnalistaReportes = "AnalistaReportes";
    public const string RoleUsuario = "Usuario";
    public const string ClaimPermiso = "permiso";
    public const string PermisoLeerReporteProduccion = "reportes:produccion:leer";
    public const string PermisoRecursosBasicos = "recursos:basicos";

    public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity?.IsAuthenticated != true)
            return Task.FromResult(principal);

        if (principal.HasClaim(c => c.Type == ClaimPermiso))
            return Task.FromResult(principal);

        var provider = principal.Identities
            .Select(i => i.AuthenticationType)
            .FirstOrDefault(t => t is "Twitch" or "Microsoft")
            ?? principal.Identity.AuthenticationType
            ?? string.Empty;

        var userName = principal.Identity.Name
            ?? principal.FindFirst("name")?.Value
            ?? principal.FindFirst("preferred_username")?.Value
            ?? string.Empty;

        var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

        var allowedUsersRaw = Environment.GetEnvironmentVariable("REPORT_ALLOWED_USERS");
        var allowedProvidersRaw = Environment.GetEnvironmentVariable("REPORT_ALLOWED_PROVIDERS");

        var allowedUsers = string.IsNullOrWhiteSpace(allowedUsersRaw)
            ? Array.Empty<string>()
            : allowedUsersRaw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        // Por defecto autoriza el proveedor Twitch para que en la demostración:
        // - Sin sesión -> 401 Unauthorized
        // - Sesión Twitch (o usuario en REPORT_ALLOWED_USERS) -> 200 OK (Rol AnalistaReportes)
        // - Sesión Microsoft (sin estar en la lista) -> 403 Forbidden (Rol Usuario)
        var allowedProviders = string.IsNullOrWhiteSpace(allowedProvidersRaw)
            ? new[] { "Twitch" }
            : allowedProvidersRaw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var matchesAllowedUser = allowedUsers.Length > 0 && (
            allowedUsers.Contains(userName, StringComparer.OrdinalIgnoreCase) ||
            allowedUsers.Contains(userId, StringComparer.OrdinalIgnoreCase));

        var matchesAllowedProvider = allowedProviders.Contains(provider, StringComparer.OrdinalIgnoreCase);

        var hasReportAccess = allowedUsers.Length > 0
            ? matchesAllowedUser
            : matchesAllowedProvider;

        var extraIdentity = new ClaimsIdentity();
        extraIdentity.AddClaim(new Claim(ClaimPermiso, PermisoRecursosBasicos));

        if (hasReportAccess)
        {
            extraIdentity.AddClaim(new Claim(ClaimTypes.Role, RoleAnalistaReportes));
            extraIdentity.AddClaim(new Claim(ClaimPermiso, PermisoLeerReporteProduccion));
        }
        else
        {
            extraIdentity.AddClaim(new Claim(ClaimTypes.Role, RoleUsuario));
        }

        principal.AddIdentity(extraIdentity);
        return Task.FromResult(principal);
    }
}
