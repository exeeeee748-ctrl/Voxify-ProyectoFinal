using backend_dotnet.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Voxify.API.Data.Configurations;

public class AudioConfiguration : IEntityTypeConfiguration<Audio>
{
    public void Configure(EntityTypeBuilder<Audio> builder)
    {
        builder.HasKey(a => a.IdAudio);

        builder.Property(a => a.IdAudio)
            .UseIdentityColumn();

        builder.Property(a => a.DireccionFisica)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(a => a.NombreArchivo)
            .HasMaxLength(255);

        builder.Property(a => a.Formato)
            .HasMaxLength(10);

        builder.Property(a => a.Estado)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasOne(a => a.Usuario)
            .WithMany(u => u.Audios)
            .HasForeignKey(a => a.IdUsuario)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Voz)
            .WithMany(v => v.Audios)
            .HasForeignKey(a => a.IdVoz)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Idioma)
            .WithMany(i => i.Audios)
            .HasForeignKey(a => a.IdIdioma)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
