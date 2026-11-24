using backend_dotnet.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Voxify.API.Data.Configurations;

public class IdiomaConfiguration : IEntityTypeConfiguration<Idioma>
{
    public void Configure(EntityTypeBuilder<Idioma> builder)
    {
        builder.HasKey(i => i.IdIdioma);

        builder.Property(i => i.IdIdioma)
            .UseIdentityColumn();

        builder.Property(i => i.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(i => i.Codigo)
            .IsRequired()
            .HasMaxLength(10);

        builder.HasIndex(i => i.Codigo)
            .IsUnique();
    }
}