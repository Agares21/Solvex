using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Solvex.Api.Data;

/// <summary>Permite generar migraciones sin iniciar el servidor web ni conectarse a una base de datos.</summary>
public sealed class SolvexDbContextFactory : IDesignTimeDbContextFactory<SolvexDbContext>
{
    public SolvexDbContext CreateDbContext(string[] args)
    {
        var connection = Environment.GetEnvironmentVariable("ConnectionStrings__Solvex")
            ?? "Server=(localdb)\\mssqllocaldb;Database=SolvexDesignTime;Integrated Security=True;TrustServerCertificate=True";
        return new SolvexDbContext(new DbContextOptionsBuilder<SolvexDbContext>().UseSqlServer(connection).Options);
    }
}
