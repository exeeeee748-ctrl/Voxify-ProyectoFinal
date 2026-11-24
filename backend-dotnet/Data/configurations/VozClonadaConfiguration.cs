using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VozClonada = backend_dotnet.Models.Voces.VozClonada;

namespace Voxify.API.Data.Configurations;

public class VozClonadaConfiguration : IEntityTypeConfiguration<VozClonada>
{
    public void Configure(EntityTypeBuilder<VozClonada> builder)
    {
        builder.HasKey(v => v.IdVoz);

        builder.Property(v => v.Estado)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(v => v.Archivo)
            .HasMaxLength(500);

        builder.HasOne(v => v.Voz)
            .WithOne(voz => voz.VozClonada)
            .HasForeignKey<VozClonada>(v => v.IdVoz)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(v => v.Usuario)
            .WithMany(u => u.VocesClonadas)
            .HasForeignKey(v => v.IdUsuario)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(v => v.IdSolicitudClonacion)
            .IsUnique();

        builder.HasOne(v => v.SolicitudClonacion)
            .WithOne(s => s.VozClonada)
            .HasForeignKey<VozClonada>(v => v.IdSolicitudClonacion)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
