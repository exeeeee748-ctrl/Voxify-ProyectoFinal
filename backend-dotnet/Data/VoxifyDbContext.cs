using Microsoft.EntityFrameworkCore;
using backend_dotnet.Models;

namespace backend_dotnet.Data;

public class VoxifyDbContext : DbContext
{
    public VoxifyDbContext(DbContextOptions<VoxifyDbContext> options)
        : base(options)
    {
    }

    public DbSet<Idioma> Idiomas { get; set; }

    public DbSet<SolicitudGeneracion> SolicitudesGeneracion { get; set; }
public DbSet<Audio> Audios { get; set; }
public DbSet<HistorialAudio> HistorialAudios { get; set; }
}


