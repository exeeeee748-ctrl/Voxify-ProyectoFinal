using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SolicitudClonacion = backend_dotnet.Models.Voces.SolicitudClonacion;

namespace Voxify.API.Data.Configurations;

public class SolicitudClonacionConfiguration
    : IEntityTypeConfiguration<SolicitudClonacion>
{
    public void Configure(EntityTypeBuilder<SolicitudClonacion> builder)
    {
        builder.HasKey(s => s.IdSolicitudClonacion);

        builder.Property(s => s.IdSolicitudClonacion)
            .UseIdentityColumn();

        builder.Property(s => s.NombreVoz)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.Estado)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(s => s.MensajeError)
            .HasMaxLength(500);

        builder.HasOne(s => s.Usuario)
            .WithMany(u => u.SolicitudesClonacion)
            .HasForeignKey(s => s.IdUsuario)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
