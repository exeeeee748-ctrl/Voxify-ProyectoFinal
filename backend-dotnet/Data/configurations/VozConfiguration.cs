using backend_dotnet.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Voxify.API.Data.Configurations;

public class VozConfiguration : IEntityTypeConfiguration<Voz>
{
    public void Configure(EntityTypeBuilder<Voz> builder)
    {
        builder.HasKey(v => v.IdVoz);

        builder.Property(v => v.IdVoz)
            .UseIdentityColumn();

        builder.Property(v => v.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(v => v.Descripcion)
            .HasMaxLength(500);

        builder.Property(v => v.Genero)
            .HasMaxLength(50);

        builder.Property(v => v.Acento)
            .HasMaxLength(100);

        builder.Property(v => v.Tipo)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(v => v.Estado)
            .IsRequired()
            .HasConversion<int>();
    }
}