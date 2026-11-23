# Contribuir

## Fork y rama

1. Haga un fork del repositorio base.
2. Clone su fork y agregue el repositorio base como `upstream`.
3. Cree una rama desde `master` o desde la rama integrada que corresponda:

```bash
git switch master
git pull upstream master
git switch -c feature/nombre-aporte
```

No agregue miembros externos como colaboradores del repositorio base.

## Commits

Use mensajes en infinitivo e inclusivos:

- `Agregar modelos y migracion de idiomas`
- `Implementar inicio de sesion con Microsoft`
- `Agregar PUT y soft delete de audios`

Para el aporte PUT + DELETE de soft delete se requieren dos commits separados y una sola PR.

## Pruebas

```bash
cd backend-dotnet
dotnet restore
dotnet build
dotnet ef database update
dotnet run
```

Pruebe los recursos con una sesion autenticada y sin sesion. Los endpoints protegidos deben rechazar las consultas y altas anónimas.

## Pull Request

1. Envie la rama a su fork.
2. Abra una PR hacia `master` del repositorio base.
3. Explique tablas, endpoints, proveedor y cambios de migracion.
4. Solicite revision a otro integrante.
5. Corrija los comentarios; no se integra una PR sin aprobacion de quien no es el autor.

Las PR propias del lider deben ser revisadas por otro integrante y integradas por el lider.
