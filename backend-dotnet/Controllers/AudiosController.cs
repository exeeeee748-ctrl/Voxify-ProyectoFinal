using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend_dotnet.Data;
using backend_dotnet.Models;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AudiosController : ControllerBase
{
    private readonly VoxifyDbContext _context;

    public AudiosController(VoxifyDbContext context)
    {
        _context = context;
    }

    // POST: api/Audios
    [HttpPost]
    public async Task<IActionResult> CrearAudio(Audio audio)
    {
        var solicitudExiste = await _context.SolicitudesGeneracion
            .AnyAsync(s => s.Id == audio.SolicitudGeneracionId && s.Activo);

        if (!solicitudExiste)
            return BadRequest("La solicitud de generación no existe o está inactiva.");

        _context.Audios.Add(audio);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerPorId),
            new { id = audio.Id }, audio);
    }

    // GET: api/Audios
    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        var audios = await _context.Audios
            .Include(a => a.SolicitudGeneracion)
            .Where(a => a.Activo)
            .ToListAsync();

        return Ok(audios);
    }

    // GET: api/Audios/5
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var audio = await _context.Audios
            .Include(a => a.SolicitudGeneracion)
            .FirstOrDefaultAsync(a => a.Id == id && a.Activo);

        if (audio == null)
            return NotFound("Audio no encontrado.");

        return Ok(audio);
    }

    // PUT: api/Audios/5
    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarAudio(int id, Audio datos)
    {
        var audio = await _context.Audios
            .FirstOrDefaultAsync(a => a.Id == id && a.Activo);

        if (audio == null)
            return NotFound("Audio no encontrado.");

        var solicitudExiste = await _context.SolicitudesGeneracion
            .AnyAsync(s => s.Id == datos.SolicitudGeneracionId && s.Activo);

        if (!solicitudExiste)
            return BadRequest("La solicitud no existe o está inactiva.");

        audio.NombreArchivo = datos.NombreArchivo;
        audio.RutaArchivo = datos.RutaArchivo;
        audio.SolicitudGeneracionId = datos.SolicitudGeneracionId;

        await _context.SaveChangesAsync();

        return Ok(audio);
    }

    // DELETE: api/Audios/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarAudio(int id)
    {
        var audio = await _context.Audios
            .FirstOrDefaultAsync(a => a.Id == id && a.Activo);

        if (audio == null)
            return NotFound("Audio no encontrado.");

        audio.Activo = false;

        await _context.SaveChangesAsync();

        return Ok("Audio eliminado lógicamente.");
    }
}
