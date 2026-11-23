using backend_dotnet.Data;
using backend_dotnet.DTOs.Voces;
using backend_dotnet.Models.Voces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_dotnet.Controllers.Voces;

[ApiController]
[Route("api/[controller]")]
public class VozController : ControllerBase
{
    private readonly VoxifyDbContext _context;

    public VozController(VoxifyDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        return Ok(await _context.Voces.ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var voz = await _context.Voces.FindAsync(id);
        return voz == null ? NotFound() : Ok(voz);
    }

    [HttpPost]
    public async Task<IActionResult> Crear(VozCreateDto dto)
    {
        var voz = new Voz
        {
            Nombre = dto.Nombre,
            Descripcion = dto.Descripcion,
            Genero = dto.Genero,
            Acento = dto.Acento,
            Activa = true
        };

        _context.Voces.Add(voz);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerPorId), new { id = voz.IdVoz }, voz);
    }
}
