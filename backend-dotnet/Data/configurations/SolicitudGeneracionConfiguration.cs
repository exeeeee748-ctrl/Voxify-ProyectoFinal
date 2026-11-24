using backend_dotnet.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Voxify.API.Data.Configurations;

public class SolicitudGeneracionConfiguration
    : IEntityTypeConfiguration<SolicitudGeneracion>
{
    public void Configure(EntityTypeBuilder<SolicitudGeneracion> builder)
    {
        builder.HasKey(s => s.IdSolicitudGeneracion);

        builder.Property(s => s.IdSolicitudGeneracion)
            .UseIdentityColumn();

        builder.Property(s => s.Texto)
            .IsRequired();

        builder.Property(s => s.Estado)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(s => s.MensajeError)
            .HasMaxLength(500);

        builder.HasOne(s => s.Usuario)
            .WithMany(u => u.SolicitudesGeneracion)
            .HasForeignKey(s => s.IdUsuario)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Voz)
            .WithMany(v => v.SolicitudesGeneracion)
            .HasForeignKey(s => s.IdVoz)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Idioma)
            .WithMany(i => i.SolicitudesGeneracion)
            .HasForeignKey(s => s.IdIdioma)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Audio)
            .WithOne(a => a.SolicitudGeneracion)
            .HasForeignKey<SolicitudGeneracion>(s => s.IdAudio)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
