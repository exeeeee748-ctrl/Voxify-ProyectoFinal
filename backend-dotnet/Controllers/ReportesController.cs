using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend_dotnet.Data;
using backend_dotnet.Security;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportesController : ControllerBase
{
    private readonly VoxifyDbContext _context;

    public ReportesController(VoxifyDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Reporte autorizado de Ezequiel Gallardo:
    /// Combina Idiomas, SolicitudesGeneracion, Audios e HistorialAudios
    /// para resumir la producción de audios por idioma activo.
    /// </summary>
    [HttpGet("produccion-audios")]
    [Authorize(Policy = "ReporteProduccionAudios")]
    public async Task<IActionResult> ObtenerReporteProduccionAudios()
    {
        var idiomas = await _context.Idiomas
            .AsNoTracking()
            .Where(i => i.Activo)
            .OrderBy(i => i.Nombre)
            .ToListAsync();

        var solicitudes = await _context.SolicitudesGeneracion
            .AsNoTracking()
            .Where(s => s.Activo)
            .ToListAsync();

        var audios = await _context.Audios
            .AsNoTracking()
            .Where(a => a.Activo)
            .ToListAsync();

        var historial = await _context.HistorialAudios
            .AsNoTracking()
            .ToListAsync();

        var solicitudesPorIdioma = solicitudes.ToLookup(s => s.IdiomaId);
        var audiosPorSolicitud = audios.ToLookup(a => a.SolicitudGeneracionId);
        var historialPorAudio = historial.ToLookup(h => h.AudioId);

        var filas = idiomas.Select(idioma =>
        {
            var solIdioma = solicitudesPorIdioma[idioma.Id].ToList();
            var audIdioma = solIdioma
                .SelectMany(s => audiosPorSolicitud[s.Id])
                .ToList();
            var histIdioma = audIdioma
                .SelectMany(a => historialPorAudio[a.Id])
                .ToList();

            var ultimoAudio = audIdioma
                .OrderByDescending(a => a.FechaCreacion)
                .FirstOrDefault();

            var completadas = solIdioma.Count(s =>
                string.Equals(s.Estado, "Completado", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(s.Estado, "Completada", StringComparison.OrdinalIgnoreCase));

            var pendientes = solIdioma.Count(s =>
                string.Equals(s.Estado, "Pendiente", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(s.Estado, "Procesando", StringComparison.OrdinalIgnoreCase));

            return new
            {
                idiomaId = idioma.Id,
                idioma = $"{idioma.Nombre} ({idioma.Codigo})",
                totalSolicitudes = solIdioma.Count,
                completadas,
                pendientes,
                audiosActivos = audIdioma.Count,
                visiblesEnHistorial = histIdioma.Count(h => h.Visible),
                ocultosEnHistorial = histIdioma.Count(h => !h.Visible),
                ultimoAudio = ultimoAudio?.NombreArchivo ?? "Sin audios",
                ultimaFecha = ultimoAudio?.FechaCreacion
            };
        })
        .OrderByDescending(r => r.totalSolicitudes)
        .ThenBy(r => r.idioma)
        .ToList();

        var totalSolicitudesActivas = solicitudes.Count;
        var totalAudiosActivos = audios.Count;
        var tasaExito = totalSolicitudesActivas == 0
            ? 0
            : Math.Round((double)totalAudiosActivos / totalSolicitudesActivas * 100, 1);

        var proveedor = User.Identities
            .Select(i => i.AuthenticationType)
            .FirstOrDefault(t => t is "Twitch" or "Microsoft") ?? "Externo";

        var rol = User.FindFirst(ClaimTypes.Role)?.Value
            ?? VoxifyClaimsTransformation.RoleAnalistaReportes;

        return Ok(new
        {
            autor = "Ezequiel Gallardo",
            proposito = "Combinar idiomas activos, solicitudes de generación, audios producidos y registros de historial para medir la producción vocal por idioma.",
            endpoint = "/api/Reportes/produccion-audios",
            tablasUtilizadas = new[] { "Idiomas", "SolicitudesGeneracion", "Audios", "HistorialAudios" },
            politicaAutorizacion = "ReporteProduccionAudios (Rol: AnalistaReportes · Permiso: reportes:produccion:leer)",
            consultadoPor = new
            {
                nombre = User.Identity?.Name
                    ?? User.FindFirst("name")?.Value
                    ?? User.FindFirst("preferred_username")?.Value
                    ?? "Usuario autenticado",
                proveedor,
                rol
            },
            generadoEn = DateTime.UtcNow,
            resumenGeneral = new
            {
                totalIdiomasActivos = idiomas.Count,
                totalSolicitudesActivas,
                totalAudiosActivos,
                totalVisiblesEnHistorial = historial.Count(h => h.Visible),
                totalOcultosEnHistorial = historial.Count(h => !h.Visible),
                tasaConversionPorcentaje = tasaExito
            },
            datos = filas
        });
    }
}
