using backend_dotnet.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend_dotnet.Data.configurations;

public class SesionUsuarioConfiguration : IEntityTypeConfiguration<SesionUsuario>
{
    public void Configure(EntityTypeBuilder<SesionUsuario> builder)
    {
        builder.ToTable("SesionesUsuario");

        builder.HasKey(s => s.IdSesion);

        builder.Property(s => s.Proveedor)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(s => s.FechaCreacion)
            .IsRequired();

        builder.Property(s => s.FechaExpiracion)
            .IsRequired();

        builder.Property(s => s.Activa)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(s => s.MotivoRevocacion)
            .HasMaxLength(150);

        builder.Property(s => s.IpOrigen)
            .HasMaxLength(64);

        builder.Property(s => s.UserAgent)
            .HasMaxLength(300);

        builder.HasIndex(s => new { s.IdUsuario, s.Activa });

        builder.HasOne(s => s.Usuario)
            .WithMany(u => u.Sesiones)
            .HasForeignKey(s => s.IdUsuario)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
