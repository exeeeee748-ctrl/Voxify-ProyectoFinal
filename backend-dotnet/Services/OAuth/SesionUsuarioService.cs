using backend_dotnet.Data;
using backend_dotnet.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace backend_dotnet.Services.OAuth;

public class SesionUsuarioService : ISesionUsuarioService
{
    private readonly VoxifyDbContext _context;

    public SesionUsuarioService(VoxifyDbContext context)
    {
        _context = context;
    }

    public async Task<SesionUsuario> CrearSesionAsync(
        int idUsuario,
        string proveedor,
        HttpContext? httpContext,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var ipOrigen = httpContext?.Request.Headers["X-Forwarded-For"].FirstOrDefault()
            ?? httpContext?.Connection.RemoteIpAddress?.ToString();
        var userAgent = httpContext?.Request.Headers.UserAgent.ToString();

        var sesion = new SesionUsuario
        {
            IdSesion = Guid.NewGuid(),
            IdUsuario = idUsuario,
            Proveedor = Truncar(string.IsNullOrWhiteSpace(proveedor) ? "voxify" : proveedor.Trim().ToLowerInvariant(), 50)!,
            FechaCreacion = now,
            FechaExpiracion = now.AddDays(7),
            Activa = true,
            IpOrigen = Truncar(ipOrigen, 64),
            UserAgent = Truncar(userAgent, 300)
        };

        _context.SesionesUsuario.Add(sesion);
        await _context.SaveChangesAsync(cancellationToken);

        return sesion;
    }

    public async Task<bool> EsSesionActivaAsync(
        Guid idSesion,
        int idUsuario,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        return await _context.SesionesUsuario
            .AsNoTracking()
            .AnyAsync(
                s => s.IdSesion == idSesion
                    && s.IdUsuario == idUsuario
                    && s.Activa
                    && s.FechaRevocacion == null
                    && s.FechaExpiracion > now,
                cancellationToken);
    }

    public async Task<int> RevocarTodasAsync(
        int idUsuario,
        string motivo = "Single Sign-Out global",
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var motivoLimpio = Truncar(motivo, 150);

        return await _context.SesionesUsuario
            .Where(s => s.IdUsuario == idUsuario && s.Activa)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(s => s.Activa, false)
                    .SetProperty(s => s.FechaRevocacion, now)
                    .SetProperty(s => s.MotivoRevocacion, motivoLimpio),
                cancellationToken);
    }

    public async Task<bool> RevocarSesionAsync(
        Guid idSesion,
        int idUsuario,
        string motivo = "Cierre de sesión individual",
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var motivoLimpio = Truncar(motivo, 150);

        var afectadas = await _context.SesionesUsuario
            .Where(s => s.IdSesion == idSesion && s.IdUsuario == idUsuario && s.Activa)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(s => s.Activa, false)
                    .SetProperty(s => s.FechaRevocacion, now)
                    .SetProperty(s => s.MotivoRevocacion, motivoLimpio),
                cancellationToken);

        return afectadas > 0;
    }

    public async Task<IReadOnlyList<SesionUsuario>> ListarPorUsuarioAsync(
        int idUsuario,
        CancellationToken cancellationToken = default)
    {
        return await _context.SesionesUsuario
            .AsNoTracking()
            .Where(s => s.IdUsuario == idUsuario)
            .OrderByDescending(s => s.Activa)
            .ThenByDescending(s => s.FechaCreacion)
            .Take(20)
            .ToListAsync(cancellationToken);
    }

    private static string? Truncar(string? valor, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return null;

        var limpio = valor.Trim();
        return limpio.Length <= maxLength ? limpio : limpio[..maxLength];
    }
}
