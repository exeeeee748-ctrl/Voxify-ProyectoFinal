using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend_dotnet.Data;
using backend_dotnet.Models;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IdiomasController : ControllerBase
{
    private readonly VoxifyDbContext _context;

    public IdiomasController(VoxifyDbContext context)
    {
        _context = context;
    }

    // POST: api/Idiomas
    [HttpPost]
    public async Task<IActionResult> CrearIdioma(Idioma idioma)
    {
        _context.Idiomas.Add(idioma);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerPorId),
            new { id = idioma.Id }, idioma);
    }

    // GET: api/Idiomas
    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        var idiomas = await _context.Idiomas
            .Where(i => i.Activo)
            .ToListAsync();

        return Ok(idiomas);
    }

    // GET: api/Idiomas/5
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var idioma = await _context.Idiomas
            .FirstOrDefaultAsync(i => i.Id == id && i.Activo);

        if (idioma == null)
            return NotFound("Idioma no encontrado.");

        return Ok(idioma);
    }

    // PUT: api/Idiomas/5
    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarIdioma(int id, Idioma datos)
    {
        var idioma = await _context.Idiomas
            .FirstOrDefaultAsync(i => i.Id == id && i.Activo);

        if (idioma == null)
            return NotFound("Idioma no encontrado.");

        idioma.Nombre = datos.Nombre;
        idioma.Codigo = datos.Codigo;

        await _context.SaveChangesAsync();

        return Ok(idioma);
    }
}
