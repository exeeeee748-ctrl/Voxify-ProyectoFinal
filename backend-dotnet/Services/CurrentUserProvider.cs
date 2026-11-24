using backend_dotnet.Data;
using backend_dotnet.Models;
using backend_dotnet.Security;
using Microsoft.EntityFrameworkCore;

namespace backend_dotnet.Services;

public interface ICurrentUserProvider
{
    Task<Usuario> ObtenerAsync(CancellationToken cancellationToken = default);
}

public sealed class CurrentUserProvider : ICurrentUserProvider
{
    private readonly VoxifyDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private Usuario? _usuario;

    public CurrentUserProvider(VoxifyDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Usuario> ObtenerAsync(CancellationToken cancellationToken = default)
    {
        if (_usuario is not null)
            return _usuario;

        var idClaim = _httpContextAccessor.HttpContext?.User
            .FindFirst(VoxifyClaims.IdUsuario)?.Value;

        if (!int.TryParse(idClaim, out var idUsuario))
            throw new UnauthorizedAccessException("No hay una sesión de Voxify válida.");

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.IdUsuario == idUsuario, cancellationToken)
            ?? throw new UnauthorizedAccessException("El usuario de la sesión no existe.");

        if (usuario.Estado != EstadoUsuario.Activo)
            throw new UnauthorizedAccessException("El usuario de la sesión está inactivo.");

        _usuario = usuario;
        return usuario;
    }
}
