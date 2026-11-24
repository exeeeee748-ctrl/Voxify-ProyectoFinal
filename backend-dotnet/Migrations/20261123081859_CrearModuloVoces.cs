using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend_dotnet.Migrations
{
    /// <inheritdoc />
    public partial class CrearModuloVoces : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // La tabla Voces ya existe en el modelo local; solo se agregan
            // las columnas que necesita el módulo de voces.
            migrationBuilder.AddColumn<string>(
                name: "Descripcion",
                table: "Voces",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Genero",
                table: "Voces",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Acento",
                table: "Voces",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SolicitudesClonacion",
                columns: table => new
                {
                    IdSolicitudClonacion = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    Estado = table.Column<string>(type: "text", nullable: false),
                    FechaSolicitud = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Activa = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SolicitudesClonacion", x => x.IdSolicitudClonacion);
                });

            migrationBuilder.CreateTable(
                name: "MuestrasVoz",
                columns: table => new
                {
                    IdMuestraVoz = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdSolicitudClonacion = table.Column<int>(type: "integer", nullable: false),
                    Archivo = table.Column<string>(type: "text", nullable: false),
                    DuracionSegundos = table.Column<double>(type: "double precision", nullable: true),
                    FechaRegistro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Activa = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MuestrasVoz", x => x.IdMuestraVoz);
                    table.ForeignKey(
                        name: "FK_MuestrasVoz_SolicitudesClonacion_IdSolicitudClonacion",
                        column: x => x.IdSolicitudClonacion,
                        principalTable: "SolicitudesClonacion",
                        principalColumn: "IdSolicitudClonacion",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VocesClonadas",
                columns: table => new
                {
                    IdVozClonada = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    IdVoz = table.Column<int>(type: "integer", nullable: true),
                    Nombre = table.Column<string>(type: "text", nullable: false),
                    Archivo = table.Column<string>(type: "text", nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Activa = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VocesClonadas", x => x.IdVozClonada);
                    table.ForeignKey(
                        name: "FK_VocesClonadas_Voces_IdVoz",
                        column: x => x.IdVoz,
                        principalTable: "Voces",
                        principalColumn: "IdVoz",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MuestrasVoz_IdSolicitudClonacion",
                table: "MuestrasVoz",
                column: "IdSolicitudClonacion");

            migrationBuilder.CreateIndex(
                name: "IX_VocesClonadas_IdVoz",
                table: "VocesClonadas",
                column: "IdVoz");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MuestrasVoz");

            migrationBuilder.DropTable(
                name: "VocesClonadas");

            migrationBuilder.DropTable(
                name: "SolicitudesClonacion");

            migrationBuilder.DropColumn(
                name: "Descripcion",
                table: "Voces");

            migrationBuilder.DropColumn(
                name: "Genero",
                table: "Voces");

            migrationBuilder.DropColumn(
                name: "Acento",
                table: "Voces");
        }
    }
}
