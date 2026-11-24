using backend_dotnet.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Voxify.API.Data.Configurations;

public class VozIdiomaConfiguration : IEntityTypeConfiguration<VozIdioma>
{
    public void Configure(EntityTypeBuilder<VozIdioma> builder)
    {
        builder.HasKey(v => new { v.IdVoz, v.IdIdioma });

        builder.HasOne(v => v.Voz)
            .WithMany(voz => voz.VozIdioma)
            .HasForeignKey(v => v.IdVoz)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(v => v.Idioma)
            .WithMany(idioma => idioma.VozIdioma)
            .HasForeignKey(v => v.IdIdioma)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
