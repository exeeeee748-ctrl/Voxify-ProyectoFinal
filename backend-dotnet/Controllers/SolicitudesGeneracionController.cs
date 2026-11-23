using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend_dotnet.Data;
using backend_dotnet.Models;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SolicitudesGeneracionController : ControllerBase
{
    private readonly VoxifyDbContext _context;

    public SolicitudesGeneracionController(VoxifyDbContext context)
    {
        _context = context;
    }

    // POST: api/SolicitudesGeneracion
    [HttpPost]
    public async Task<IActionResult> CrearSolicitud(SolicitudGeneracion solicitud)
    {
        var idiomaExiste = await _context.Idiomas
            .AnyAsync(i => i.Id == solicitud.IdiomaId && i.Activo);

        if (!idiomaExiste)
            return BadRequest("El idioma indicado no existe o está inactivo.");

        _context.SolicitudesGeneracion.Add(solicitud);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerPorId),
            new { id = solicitud.Id }, solicitud);
    }

    // GET: api/SolicitudesGeneracion
    [HttpGet]
    public async Task<IActionResult> ObtenerTodas()
    {
        var solicitudes = await _context.SolicitudesGeneracion
            .Include(s => s.Idioma)
            .Where(s => s.Activo)
            .ToListAsync();

        return Ok(solicitudes);
    }

    // GET: api/SolicitudesGeneracion/5
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var solicitud = await _context.SolicitudesGeneracion
            .Include(s => s.Idioma)
            .FirstOrDefaultAsync(s => s.Id == id && s.Activo);

        if (solicitud == null)
            return NotFound("Solicitud no encontrada.");

        return Ok(solicitud);
    }

    // PUT: api/SolicitudesGeneracion/5
    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarSolicitud(int id, SolicitudGeneracion datos)
    {
        var solicitud = await _context.SolicitudesGeneracion
            .FirstOrDefaultAsync(s => s.Id == id && s.Activo);

        if (solicitud == null)
            return NotFound("Solicitud no encontrada.");

        var idiomaExiste = await _context.Idiomas
            .AnyAsync(i => i.Id == datos.IdiomaId && i.Activo);

        if (!idiomaExiste)
            return BadRequest("El idioma indicado no existe o está inactivo.");

        solicitud.Texto = datos.Texto;
        solicitud.Estado = datos.Estado;
        solicitud.IdiomaId = datos.IdiomaId;

        await _context.SaveChangesAsync();

        return Ok(solicitud);
    }

    // DELETE: api/SolicitudesGeneracion/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarSolicitud(int id)
    {
        var solicitud = await _context.SolicitudesGeneracion
            .FirstOrDefaultAsync(s => s.Id == id && s.Activo);

        if (solicitud == null)
            return NotFound("Solicitud no encontrada.");

        solicitud.Activo = false;

        await _context.SaveChangesAsync();

        return Ok("Solicitud eliminada lógicamente.");
    }
}
