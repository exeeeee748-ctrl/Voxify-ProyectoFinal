using System.Security.Claims;
using backend_dotnet.Security;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Logging;

namespace backend_dotnet.Services.OAuth;

public static class OAuthTicketHandler
{
    public static async Task HandleTicketReceived(TicketReceivedContext context)
    {
        var logger = context.HttpContext.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger("Voxify.OAuth");

        try
        {
            var provider = context.Scheme.Name.ToLowerInvariant();
            var principal = context.Principal
                ?? throw new InvalidOperationException("El proveedor no devolvió una identidad.");

            var providerUserId = FirstClaim(
                principal,
                ClaimTypes.NameIdentifier,
                "sub",
                "oid",
                "http://schemas.microsoft.com/identity/claims/objectidentifier",
                "urn:twitch:helix:id");

            if (string.IsNullOrWhiteSpace(providerUserId))
            {
                throw new InvalidOperationException(
                    "El proveedor no devolvió un identificador de usuario.");
            }

            var email = FirstClaim(principal, ClaimTypes.Email, "email");
            if (string.IsNullOrWhiteSpace(email))
            {
                var preferred = FirstClaim(principal, "preferred_username", "userPrincipalName");
                if (!string.IsNullOrWhiteSpace(preferred) && preferred.Contains('@'))
                    email = preferred;
            }

            var emailVerifiedClaim = FirstClaim(principal, "email_verified");
            var emailVerified = emailVerifiedClaim is not null
                ? bool.TryParse(emailVerifiedClaim, out var parsed) && parsed
                : provider is "microsoft" or "twitch" && !string.IsNullOrWhiteSpace(email);

            var displayName = FirstClaim(
                principal,
                ClaimTypes.Name,
                "name",
                "display_name",
                "preferred_username",
                "urn:twitch:displayname",
                "urn:twitch:helix/display_name");

            var avatarUrl = FirstClaim(
                principal,
                "avatar_url",
                "picture",
                "urn:twitch:profileimageurl",
                "urn:twitch:helix/profile_image_url");

            var cookieResult = await context.HttpContext.AuthenticateAsync(
                CookieAuthenticationDefaults.AuthenticationScheme);
            var sessionPrincipal = cookieResult.Succeeded
                ? cookieResult.Principal
                : context.HttpContext.User;

            var idUsuarioSesion = ResolverUsuarioSesion(sessionPrincipal);

            var service = context.HttpContext.RequestServices
                .GetRequiredService<IUsuarioOAuthService>();

            var usuario = await service.FindOrCreateAsync(
                new OAuthLoginInfo(
                    provider,
                    providerUserId,
                    email,
                    emailVerified,
                    displayName,
                    avatarUrl),
                idUsuarioSesion,
                context.HttpContext.RequestAborted);

            var sesionService = context.HttpContext.RequestServices
                .GetRequiredService<ISesionUsuarioService>();

            var sesion = await sesionService.CrearSesionAsync(
                usuario.IdUsuario,
                provider,
                context.HttpContext,
                context.HttpContext.RequestAborted);

            var identity = new ClaimsIdentity("Voxify");
            identity.AddClaim(new Claim(
                VoxifyClaims.IdUsuario,
                usuario.IdUsuario.ToString()));
            identity.AddClaim(new Claim(
                VoxifyClaims.IdSesion,
                sesion.IdSesion.ToString()));
            identity.AddClaim(new Claim(ClaimTypes.Name, usuario.Nombre));
            identity.AddClaim(new Claim(VoxifyClaims.Proveedor, provider));

            if (!string.IsNullOrWhiteSpace(usuario.Correo))
                identity.AddClaim(new Claim(ClaimTypes.Email, usuario.Correo));

            if (!string.IsNullOrWhiteSpace(usuario.AvatarUrl))
                identity.AddClaim(new Claim(VoxifyClaims.AvatarUrl, usuario.AvatarUrl));

            principal.AddIdentity(identity);
            context.Principal = principal;

            logger.LogInformation(
                "OAuth completado | provider={Provider} | idUsuario={IdUsuario} | vinculado={Vinculado}",
                provider,
                usuario.IdUsuario,
                idUsuarioSesion.HasValue);
        }
        catch (OAuthAccountLinkException ex)
        {
            logger.LogWarning(ex, "Conflicto al vincular una cuenta OAuth.");
            RedirectToLogin(context, ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error procesando el ticket OAuth.");
            RedirectToLogin(
                context,
                "No se pudo completar el inicio de sesión con el proveedor.");
        }
    }

    public static Task HandleRemoteFailure(RemoteFailureContext context)
    {
        var logger = context.HttpContext.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger("Voxify.OAuth");

        logger.LogWarning(
            context.Failure,
            "Fallo remoto de OAuth | provider={Provider} | error={Error}",
            context.Scheme.Name,
            context.Request.Query["error"].ToString());

        var message = string.Equals(
            context.Request.Query["error"].ToString(),
            "access_denied",
            StringComparison.OrdinalIgnoreCase)
            ? "Cancelaste el inicio de sesión en el proveedor."
            : "No se pudo completar el inicio de sesión con el proveedor.";

        var frontend = GetFrontendUrl();
        context.Response.Redirect(
            $"{frontend}/login?authError={Uri.EscapeDataString(message)}");
        context.HandleResponse();
        return Task.CompletedTask;
    }

    private static void RedirectToLogin(TicketReceivedContext context, string message)
    {
        var frontend = GetFrontendUrl();
        context.Response.Redirect(
            $"{frontend}/login?authError={Uri.EscapeDataString(message)}");
        context.HandleResponse();
    }

    private static string GetFrontendUrl()
    {
        return (Environment.GetEnvironmentVariable("FRONTEND_URL")
            ?? "http://localhost:3000").TrimEnd('/');
    }

    private static int? ResolverUsuarioSesion(ClaimsPrincipal? principal)
    {
        var value = principal?.FindFirst(VoxifyClaims.IdUsuario)?.Value;
        return int.TryParse(value, out var id) ? id : null;
    }

    private static string? FirstClaim(ClaimsPrincipal principal, params string[] types)
    {
        foreach (var type in types)
        {
            var value = principal.FindFirst(type)?.Value;
            if (!string.IsNullOrWhiteSpace(value))
                return value;
        }

        return null;
    }
}
