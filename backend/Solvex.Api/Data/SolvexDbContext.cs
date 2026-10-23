using Microsoft.EntityFrameworkCore;
using Solvex.Api.Entities;

namespace Solvex.Api.Data;

public sealed class SolvexDbContext(DbContextOptions<SolvexDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<InventoryMovement> InventoryMovements => Set<InventoryMovement>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var product = modelBuilder.Entity<Product>();
        product.ToTable("Products", table => {
            table.HasCheckConstraint("CK_Products_Price", "[Price] >= 0");
            table.HasCheckConstraint("CK_Products_Stock", "[Stock] >= 0");
        });
        product.HasKey(p => p.Id);
        product.Property(p => p.Code).HasMaxLength(40).IsRequired();
        product.HasIndex(p => p.Code).IsUnique();
        product.Property(p => p.Name).HasMaxLength(150).IsRequired();
        product.Property(p => p.Description).HasMaxLength(1000);
        product.Property(p => p.Price).HasPrecision(10, 2);
        product.Property(p => p.Stock).HasDefaultValue(0);

        var movement = modelBuilder.Entity<InventoryMovement>();
        movement.ToTable("InventoryMovements", table => {
            table.HasCheckConstraint("CK_InventoryMovements_Quantity", "[Quantity] > 0");
            table.HasCheckConstraint("CK_InventoryMovements_Type", "[Type] IN ('Entry', 'Exit')");
        });
        movement.HasKey(m => m.Id);
        movement.Property(m => m.Type).HasConversion<string>().HasMaxLength(10);
        movement.Property(m => m.Reason).HasMaxLength(300).IsRequired();
        movement.HasOne(m => m.Product).WithMany().HasForeignKey(m => m.ProductId).OnDelete(DeleteBehavior.Restrict);
        movement.HasIndex(m => new { m.ProductId, m.RegisteredAt, m.Id });
    }
}
