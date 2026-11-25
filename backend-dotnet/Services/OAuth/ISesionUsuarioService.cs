using backend_dotnet.Models;
using Microsoft.AspNetCore.Http;

namespace backend_dotnet.Services.OAuth;

public interface ISesionUsuarioService
{
    Task<SesionUsuario> CrearSesionAsync(
        int idUsuario,
        string proveedor,
        HttpContext? httpContext,
        CancellationToken cancellationToken = default);

    Task<bool> EsSesionActivaAsync(
        Guid idSesion,
        int idUsuario,
        CancellationToken cancellationToken = default);

    Task<int> RevocarTodasAsync(
        int idUsuario,
        string motivo = "Single Sign-Out global",
        CancellationToken cancellationToken = default);

    Task<bool> RevocarSesionAsync(
        Guid idSesion,
        int idUsuario,
        string motivo = "Cierre de sesión individual",
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SesionUsuario>> ListarPorUsuarioAsync(
        int idUsuario,
        CancellationToken cancellationToken = default);
}
