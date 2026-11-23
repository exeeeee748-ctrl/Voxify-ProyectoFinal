using backend_dotnet.Models.Voces;
using Microsoft.EntityFrameworkCore;

namespace backend_dotnet.Data;

public class VoxifyDbContext : DbContext
{
    public VoxifyDbContext(DbContextOptions<VoxifyDbContext> options)
        : base(options)
    {
    }

    public DbSet<Voz> Voces => Set<Voz>();

    public DbSet<VozClonada> VocesClonadas => Set<VozClonada>();

    public DbSet<SolicitudClonacion> SolicitudesClonacion => Set<SolicitudClonacion>();

    public DbSet<MuestraVoz> MuestrasVoz => Set<MuestraVoz>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Voz>().HasKey(v => v.IdVoz);

        modelBuilder.Entity<VozClonada>().HasKey(v => v.IdVozClonada);

        modelBuilder.Entity<SolicitudClonacion>().HasKey(s => s.IdSolicitudClonacion);

        modelBuilder.Entity<MuestraVoz>().HasKey(m => m.IdMuestraVoz);

        modelBuilder.Entity<SolicitudClonacion>()
            .HasMany(s => s.Muestras)
            .WithOne(m => m.SolicitudClonacion)
            .HasForeignKey(m => m.IdSolicitudClonacion)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<VozClonada>()
            .HasOne(v => v.Voz)
            .WithMany()
            .HasForeignKey(v => v.IdVoz)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
