using backend_dotnet.Data;
using backend_dotnet.DTOs.SolicitudesClonacion;
using backend_dotnet.Models.Voces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_dotnet.Controllers.Voces;

[ApiController]
[Route("api/[controller]")]
public class SolicitudClonacionController : ControllerBase
{
    private readonly VoxifyDbContext _context;

    public SolicitudClonacionController(VoxifyDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        return Ok(await _context.SolicitudesClonacion
            .Include(s => s.Muestras)
            .ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var solicitud = await _context.SolicitudesClonacion
            .Include(s => s.Muestras)
            .FirstOrDefaultAsync(s => s.IdSolicitudClonacion == id);

        return solicitud == null ? NotFound() : Ok(solicitud);
    }

    [HttpPost]
    public async Task<IActionResult> Crear(SolicitudClonacionCreateDto dto)
    {
        var solicitud = new SolicitudClonacion
        {
            UsuarioId = dto.UsuarioId,
            Estado = "Pendiente",
            FechaSolicitud = DateTime.UtcNow,
            Activa = true
        };

        _context.SolicitudesClonacion.Add(solicitud);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(ObtenerPorId),
            new { id = solicitud.IdSolicitudClonacion },
            solicitud);
    }
}
