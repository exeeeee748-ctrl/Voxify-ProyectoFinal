using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend_dotnet.Data;
using backend_dotnet.Models;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HistorialAudiosController : ControllerBase
{
    private readonly VoxifyDbContext _context;

    public HistorialAudiosController(VoxifyDbContext context)
    {
        _context = context;
    }

    // POST: api/HistorialAudios
    [HttpPost]
    public async Task<IActionResult> CrearRegistro(HistorialAudio historial)
    {
        var audioExiste = await _context.Audios
            .AnyAsync(a => a.Id == historial.AudioId && a.Activo);

        if (!audioExiste)
            return BadRequest("El audio indicado no existe o está inactivo.");

        _context.HistorialAudios.Add(historial);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerPorId),
            new { id = historial.Id }, historial);
    }

    // GET: api/HistorialAudios
    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        var historial = await _context.HistorialAudios
            .Include(h => h.Audio)
            .Where(h => h.Visible)
            .ToListAsync();

        return Ok(historial);
    }

    // GET: api/HistorialAudios/5
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var historial = await _context.HistorialAudios
            .Include(h => h.Audio)
            .FirstOrDefaultAsync(h => h.Id == id && h.Visible);

        if (historial == null)
            return NotFound("Registro del historial no encontrado.");

        return Ok(historial);
    }

    // PUT: api/HistorialAudios/5
    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarRegistro(int id, HistorialAudio datos)
    {
        var historial = await _context.HistorialAudios
            .FirstOrDefaultAsync(h => h.Id == id && h.Visible);

        if (historial == null)
            return NotFound("Registro del historial no encontrado.");

        var audioExiste = await _context.Audios
            .AnyAsync(a => a.Id == datos.AudioId && a.Activo);

        if (!audioExiste)
            return BadRequest("El audio indicado no existe o está inactivo.");

        historial.AudioId = datos.AudioId;

        await _context.SaveChangesAsync();

        return Ok(historial);
    }
}
