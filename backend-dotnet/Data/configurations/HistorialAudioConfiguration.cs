using backend_dotnet.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Voxify.API.Data.Configurations;

public class HistorialAudioConfiguration : IEntityTypeConfiguration<HistorialAudio>
{
    public void Configure(EntityTypeBuilder<HistorialAudio> builder)
    {
        builder.HasKey(h => h.Id);

        builder.HasOne(h => h.Audio)
            .WithMany()
            .HasForeignKey(h => h.AudioId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
