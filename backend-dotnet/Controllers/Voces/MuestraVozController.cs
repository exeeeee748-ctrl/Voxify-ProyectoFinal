using backend_dotnet.Data;
using backend_dotnet.DTOs.MuestrasVoz;
using backend_dotnet.Models.Voces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_dotnet.Controllers.Voces;

[ApiController]
[Route("api/[controller]")]
public class MuestraVozController : ControllerBase
{
    private readonly VoxifyDbContext _context;

    public MuestraVozController(VoxifyDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        return Ok(await _context.MuestrasVoz.ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var muestra = await _context.MuestrasVoz.FindAsync(id);
        return muestra == null ? NotFound() : Ok(muestra);
    }

    [HttpPost]
    public async Task<IActionResult> Crear(MuestraVozCreateDto dto)
    {
        var solicitudExiste = await _context.SolicitudesClonacion
            .AnyAsync(s => s.IdSolicitudClonacion == dto.IdSolicitudClonacion);

        if (!solicitudExiste)
        {
            return BadRequest("La solicitud de clonación indicada no existe.");
        }

        var muestra = new MuestraVoz
        {
            IdSolicitudClonacion = dto.IdSolicitudClonacion,
            Archivo = dto.Archivo,
            DuracionSegundos = dto.DuracionSegundos,
            FechaRegistro = DateTime.UtcNow,
            Activa = true
        };

        _context.MuestrasVoz.Add(muestra);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(ObtenerPorId),
            new { id = muestra.IdMuestraVoz },
            muestra);
    }
}
