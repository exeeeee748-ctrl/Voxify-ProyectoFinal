using backend_dotnet.Data;
using backend_dotnet.DTOs.VocesClonadas;
using backend_dotnet.Models.Voces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_dotnet.Controllers.Voces;

[ApiController]
[Route("api/[controller]")]
public class VozClonadaController : ControllerBase
{
    private readonly VoxifyDbContext _context;

    public VozClonadaController(VoxifyDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        return Ok(await _context.VocesClonadas.ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var voz = await _context.VocesClonadas.FindAsync(id);
        return voz == null ? NotFound() : Ok(voz);
    }

    [HttpPost]
    public async Task<IActionResult> Crear(VozClonadaCreateDto dto)
    {
        if (dto.IdVoz.HasValue &&
            !await _context.Voces.AnyAsync(v => v.IdVoz == dto.IdVoz.Value))
        {
            return BadRequest("La voz indicada no existe.");
        }

        var voz = new VozClonada
        {
            UsuarioId = dto.UsuarioId,
            IdVoz = dto.IdVoz,
            Nombre = dto.Nombre,
            Archivo = dto.Archivo,
            Activa = true
        };

        _context.VocesClonadas.Add(voz);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerPorId), new { id = voz.IdVozClonada }, voz);
    }
}
