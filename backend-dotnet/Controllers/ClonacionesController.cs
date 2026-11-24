using backend_dotnet.Data;
using backend_dotnet.DTOs.Clonaciones;
using backend_dotnet.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MuestraVoz = backend_dotnet.Models.Voces.MuestraVoz;
using SolicitudClonacion = backend_dotnet.Models.Voces.SolicitudClonacion;

namespace backend_dotnet.Controllers;

[ApiController]
[Authorize]
[Route("api/clonaciones")]
public class ClonacionesController : ControllerBase
{
    private readonly VoxifyDbContext _context;
    private readonly ICurrentUserProvider _currentUser;
    private readonly IWebHostEnvironment _environment;

    public ClonacionesController(
        VoxifyDbContext context,
        ICurrentUserProvider currentUser,
        IWebHostEnvironment environment)
    {
        _context = context;
        _currentUser = currentUser;
        _environment = environment;
    }

    // POST: api/clonaciones (multipart/form-data: nombreVoz + archivo)
    [HttpPost]
    public async Task<IActionResult> Crear(
        [FromForm] SolicitudClonacionCreateDto dto,
        IFormFile? archivo,
        CancellationToken cancellationToken)
    {
        var usuario = await _currentUser.ObtenerAsync(cancellationToken);

        var solicitud = new SolicitudClonacion
        {
            IdUsuario = usuario.IdUsuario,
            NombreVoz = dto.NombreVoz.Trim(),
            Estado = "Pendiente",
            FechaSolicitud = DateTime.UtcNow
        };

        _context.SolicitudesClonacion.Add(solicitud);
        await _context.SaveChangesAsync(cancellationToken);

        if (archivo != null && archivo.Length > 0)
        {
            var directorio = Path.Combine(_environment.ContentRootPath, "Storage", "voice-samples");
            Directory.CreateDirectory(directorio);

            var extension = Path.GetExtension(archivo.FileName);
            var nombre = $"{solicitud.IdSolicitudClonacion}_{Guid.NewGuid():N}{extension}";
            var rutaCompleta = Path.Combine(directorio, nombre);

            await using (var stream = System.IO.File.Create(rutaCompleta))
            {
                await archivo.CopyToAsync(stream, cancellationToken);
            }

            var rutaRelativa = Path
                .GetRelativePath(_environment.ContentRootPath, rutaCompleta)
                .Replace('\\', '/');

            var muestra = new MuestraVoz
            {
                IdSolicitudClonacion = solicitud.IdSolicitudClonacion,
                Nombre = archivo.FileName,
                DireccionFisica = rutaRelativa,
                FechaSubida = DateTime.UtcNow,
                Estado = "Pendiente"
            };

            _context.MuestrasVoz.Add(muestra);
            await _context.SaveChangesAsync(cancellationToken);

            solicitud.Muestra = muestra;
        }

        return CreatedAtAction(nameof(ObtenerPorId),
            new { id = solicitud.IdSolicitudClonacion }, ToDto(solicitud));
    }

    // GET: api/usuarios/me/clonaciones
    [HttpGet("/api/usuarios/me/clonaciones")]
    public async Task<IActionResult> MisClonaciones()
    {
        var usuario = await _currentUser.ObtenerAsync();

        var solicitudes = await _context.SolicitudesClonacion
            .Where(s => s.IdUsuario == usuario.IdUsuario)
            .Include(s => s.Muestra)
            .Include(s => s.VozClonada)
            .OrderByDescending(s => s.FechaSolicitud)
            .ToListAsync();

        return Ok(solicitudes.Select(ToDto));
    }

    // GET: api/clonaciones/5
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var usuario = await _currentUser.ObtenerAsync();

        var solicitud = await _context.SolicitudesClonacion
            .Include(s => s.Muestra)
            .Include(s => s.VozClonada)
            .FirstOrDefaultAsync(s => s.IdSolicitudClonacion == id && s.IdUsuario == usuario.IdUsuario);

        if (solicitud == null)
            return NotFound("Solicitud de clonación no encontrada.");

        return Ok(ToDto(solicitud));
    }

    private static SolicitudClonacionResponseDto ToDto(SolicitudClonacion s) => new()
    {
        IdSolicitudClonacion = s.IdSolicitudClonacion,
        NombreVoz = s.NombreVoz,
        Estado = s.Estado,
        FechaSolicitud = s.FechaSolicitud,
        FechaFinalizacion = s.FechaFinalizacion,
        MensajeError = s.MensajeError,
        IdMuestra = s.Muestra?.IdMuestra,
        IdVozClonada = s.VozClonada?.IdVoz
    };
}
