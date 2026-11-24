using Microsoft.EntityFrameworkCore;
using backend_dotnet.Models;
using backend_dotnet.Data.configurations;
using Voxify.API.Data.Configurations;
using MuestraVoz = backend_dotnet.Models.Voces.MuestraVoz;
using SolicitudClonacion = backend_dotnet.Models.Voces.SolicitudClonacion;
using VozClonada = backend_dotnet.Models.Voces.VozClonada;

namespace backend_dotnet.Data;

public class VoxifyDbContext : DbContext
{
    public VoxifyDbContext(DbContextOptions<VoxifyDbContext> options)
        : base(options)
    {
    }

    public DbSet<Usuario> Usuarios { get; set; }

    public DbSet<CuentaExterna> CuentasExternas { get; set; }

    public DbSet<ConfiguracionUsuario> ConfiguracionesUsuario { get; set; }

    public DbSet<FavoritoVoz> FavoritosVoz { get; set; }

    public DbSet<FavoritoIdioma> FavoritosIdioma { get; set; }

    public DbSet<Voz> Voces { get; set; }

    public DbSet<VozIdioma> VozIdioma { get; set; }

    public DbSet<Idioma> Idiomas { get; set; }

    public DbSet<VozClonada> VocesClonadas { get; set; }

    public DbSet<SolicitudClonacion> SolicitudesClonacion { get; set; }

    public DbSet<MuestraVoz> MuestrasVoz { get; set; }

    public DbSet<SolicitudGeneracion> SolicitudesGeneracion { get; set; }

    public DbSet<Audio> Audios { get; set; }

    public DbSet<HistorialAudio> HistorialAudios { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Usuario
        modelBuilder.Entity<Usuario>()
            .HasKey(u => u.IdUsuario);

        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Correo)
            .IsUnique();

        modelBuilder.Entity<Usuario>()
            .Property(u => u.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        modelBuilder.Entity<Usuario>()
            .Property(u => u.Correo)
            .IsRequired()
            .HasMaxLength(150);

        // Configuraciones de entidades
        modelBuilder.ApplyConfiguration(new CuentaExternaConfiguration());

        modelBuilder.ApplyConfiguration(new ConfiguracionUsuarioConfiguration());

        modelBuilder.ApplyConfiguration(new FavoritoVozConfiguration());

        modelBuilder.ApplyConfiguration(new FavoritoIdiomaConfiguration());

        modelBuilder.ApplyConfiguration(new VozConfiguration());

        modelBuilder.ApplyConfiguration(new VozIdiomaConfiguration());

        modelBuilder.ApplyConfiguration(new IdiomaConfiguration());

        modelBuilder.ApplyConfiguration(new VozClonadaConfiguration());

        modelBuilder.ApplyConfiguration(new SolicitudClonacionConfiguration());

        modelBuilder.ApplyConfiguration(new MuestraVozConfiguration());

        modelBuilder.ApplyConfiguration(new AudioConfiguration());

        modelBuilder.ApplyConfiguration(new SolicitudGeneracionConfiguration());

        modelBuilder.ApplyConfiguration(new HistorialAudioConfiguration());
    }
}
