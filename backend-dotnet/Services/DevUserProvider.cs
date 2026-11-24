using backend_dotnet.Data;
using backend_dotnet.Models;
using Microsoft.EntityFrameworkCore;

namespace backend_dotnet.Services;

// Acceso local de desarrollo complementario al SSO. Permite probar la
// aplicación cuando todavía no se han configurado las credenciales OAuth.
// No se confía en un IdUsuario enviado por el frontend: la identidad se
// resuelve desde la cookie emitida por /api/auth/dev-login.

public interface IDevUserProvider
{
    int IdUsuario { get; }

    Task<Usuario> ObtenerAsync(CancellationToken cancellationToken = default);
}

public class DevUserProvider : IDevUserProvider
{
    private const string CorreoDesarrollo = "dev@voxify.local";

    private readonly VoxifyDbContext _context;
    private int? _idUsuario;

    public DevUserProvider(VoxifyDbContext context)
    {
        _context = context;
    }

    public int IdUsuario => _idUsuario ?? 0;

    public async Task<Usuario> ObtenerAsync(CancellationToken cancellationToken = default)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Correo == CorreoDesarrollo, cancellationToken);

        if (usuario is null)
        {
            usuario = new Usuario
            {
                Nombre = "Usuario de desarrollo",
                Correo = CorreoDesarrollo,
                Estado = EstadoUsuario.Activo
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync(cancellationToken);
        }

        _idUsuario = usuario.IdUsuario;
        return usuario;
    }
}
