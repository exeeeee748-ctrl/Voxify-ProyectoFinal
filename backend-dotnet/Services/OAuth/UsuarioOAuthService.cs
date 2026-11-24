using backend_dotnet.Data;
using backend_dotnet.Models;
using Microsoft.EntityFrameworkCore;

namespace backend_dotnet.Services.OAuth;

public sealed record OAuthLoginInfo(
    string Provider,
    string ProviderUserId,
    string? Email,
    bool EmailVerified,
    string? DisplayName,
    string? AvatarUrl);

public sealed class OAuthAccountLinkException : Exception
{
    public OAuthAccountLinkException(string message) : base(message)
    {
    }
}

public interface IUsuarioOAuthService
{
    Task<Usuario> FindOrCreateAsync(
        OAuthLoginInfo info,
        int? idUsuarioSesion,
        CancellationToken cancellationToken = default);
}

public sealed class UsuarioOAuthService : IUsuarioOAuthService
{
    private readonly VoxifyDbContext _context;

    public UsuarioOAuthService(VoxifyDbContext context)
    {
        _context = context;
    }

    public async Task<Usuario> FindOrCreateAsync(
        OAuthLoginInfo info,
        int? idUsuarioSesion,
        CancellationToken cancellationToken = default)
    {
        var provider = info.Provider.Trim().ToLowerInvariant();

        var cuenta = await _context.CuentasExternas
            .Include(c => c.Usuario)
            .FirstOrDefaultAsync(
                c => c.Proveedor == provider && c.IdUsuarioProveedor == info.ProviderUserId,
                cancellationToken);

        Usuario usuario;

        if (cuenta is not null)
        {
            // Si el usuario ya tiene sesión, no permitimos apropiarse de una
            // identidad externa que pertenece a otra cuenta de Voxify.
            if (idUsuarioSesion.HasValue && cuenta.IdUsuario != idUsuarioSesion.Value)
            {
                throw new OAuthAccountLinkException(
                    "Esta cuenta del proveedor ya está vinculada a otro usuario de Voxify.");
            }

            usuario = cuenta.Usuario;
            cuenta.CorreoProveedor = info.Email ?? cuenta.CorreoProveedor;
            cuenta.FechaUltimoAcceso = DateTime.UtcNow;
        }
        else
        {
            usuario = await ResolverUsuarioExistenteAsync(
                info,
                provider,
                idUsuarioSesion,
                cancellationToken);

            cuenta = new CuentaExterna
            {
                Usuario = usuario,
                Proveedor = provider,
                IdUsuarioProveedor = info.ProviderUserId,
                CorreoProveedor = info.Email,
                FechaVinculacion = DateTime.UtcNow,
                FechaUltimoAcceso = DateTime.UtcNow
            };

            _context.CuentasExternas.Add(cuenta);
        }

        if (string.IsNullOrWhiteSpace(usuario.Nombre))
            usuario.Nombre = ResolverNombre(info);

        if (usuario.Estado != EstadoUsuario.Activo)
        {
            throw new OAuthAccountLinkException(
                "La cuenta de Voxify asociada está inactiva.");
        }

        if (string.IsNullOrWhiteSpace(usuario.AvatarUrl) &&
            !string.IsNullOrWhiteSpace(info.AvatarUrl))
        {
            usuario.AvatarUrl = info.AvatarUrl;
        }

        // Solo se asocia un correo cuando el proveedor garantiza que está
        // verificado y el usuario interno todavía no tiene uno.
        if (string.IsNullOrWhiteSpace(usuario.Correo) &&
            info.EmailVerified &&
            !string.IsNullOrWhiteSpace(info.Email))
        {
            usuario.Correo = info.Email;
        }

        usuario.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return usuario;
    }

    private async Task<Usuario> ResolverUsuarioExistenteAsync(
        OAuthLoginInfo info,
        string provider,
        int? idUsuarioSesion,
        CancellationToken cancellationToken)
    {
        // 1. Vinculación explícita: el usuario ya inició sesión en Voxify y
        //    está agregando otro proveedor desde su perfil.
        if (idUsuarioSesion.HasValue)
        {
            return await _context.Usuarios
                .FirstOrDefaultAsync(
                    u => u.IdUsuario == idUsuarioSesion.Value,
                    cancellationToken)
                ?? throw new OAuthAccountLinkException(
                    "El usuario de la sesión ya no existe en Voxify.");
        }

        // 2. Account linking por correo, únicamente si el proveedor garantiza
        //    que el correo está verificado. TikTok no entrega correo en el
        //    scope básico y nunca se auto-vincula por email.
        if (info.EmailVerified &&
            !string.IsNullOrWhiteSpace(info.Email) &&
            ProviderGuaranteesVerifiedEmail(provider))
        {
            var existente = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Correo == info.Email, cancellationToken);

            if (existente is not null)
                return existente;
        }

        // 3. Identidad nueva en Voxify.
        return new Usuario
        {
            Nombre = ResolverNombre(info),
            Correo = info.EmailVerified ? info.Email : null,
            AvatarUrl = info.AvatarUrl,
            Estado = EstadoUsuario.Activo,
            FechaRegistro = DateTime.UtcNow
        };
    }

    private static string ResolverNombre(OAuthLoginInfo info)
    {
        if (!string.IsNullOrWhiteSpace(info.DisplayName))
            return info.DisplayName.Trim();

        if (!string.IsNullOrWhiteSpace(info.Email))
            return info.Email.Split('@')[0];

        return "Usuario Voxify";
    }

    private static bool ProviderGuaranteesVerifiedEmail(string provider) =>
        provider is "microsoft" or "twitch";
}
