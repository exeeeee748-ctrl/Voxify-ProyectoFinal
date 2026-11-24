using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MuestraVoz = backend_dotnet.Models.Voces.MuestraVoz;

namespace Voxify.API.Data.Configurations;

public class MuestraVozConfiguration : IEntityTypeConfiguration<MuestraVoz>
{
    public void Configure(EntityTypeBuilder<MuestraVoz> builder)
    {
        builder.HasKey(m => m.IdMuestra);

        builder.Property(m => m.IdMuestra)
            .UseIdentityColumn();

        builder.Property(m => m.Nombre)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(m => m.DireccionFisica)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(m => m.Estado)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(m => m.IdSolicitudClonacion)
            .IsUnique();

        builder.HasOne(m => m.SolicitudClonacion)
            .WithOne(s => s.Muestra)
            .HasForeignKey<MuestraVoz>(m => m.IdSolicitudClonacion)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
