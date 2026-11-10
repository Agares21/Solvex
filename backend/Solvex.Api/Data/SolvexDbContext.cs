using Microsoft.EntityFrameworkCore;
using Solvex.Api.Entities;

namespace Solvex.Api.Data;

public sealed class SolvexDbContext(DbContextOptions<SolvexDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<InventoryMovement> InventoryMovements => Set<InventoryMovement>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Purchase> Purchases => Set<Purchase>();
    public DbSet<PurchaseDetail> PurchaseDetails => Set<PurchaseDetail>();
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
        movement.HasOne(m => m.PurchaseDetail).WithMany().HasForeignKey(m => m.PurchaseDetailId).OnDelete(DeleteBehavior.Restrict);
        movement.HasIndex(m => m.PurchaseDetailId).IsUnique().HasFilter("[PurchaseDetailId] IS NOT NULL");

        var supplier = modelBuilder.Entity<Supplier>();
        supplier.ToTable("Suppliers");
        supplier.HasKey(s => s.Id);
        supplier.Property(s => s.Identifier).HasMaxLength(40).IsRequired();
        supplier.HasIndex(s => s.Identifier).IsUnique();
        supplier.Property(s => s.Name).HasMaxLength(150).IsRequired();
        supplier.Property(s => s.ContactName).HasMaxLength(150);
        supplier.Property(s => s.Phone).HasMaxLength(40);
        supplier.Property(s => s.Email).HasMaxLength(254);
        supplier.Property(s => s.Address).HasMaxLength(300);

        var purchase = modelBuilder.Entity<Purchase>();
        purchase.ToTable("Purchases", table => {
            table.HasCheckConstraint("CK_Purchases_Total", "[Total] >= 0");
            table.HasCheckConstraint("CK_Purchases_Status", "([Status] = 'Pending' AND [ReceivedAt] IS NULL) OR ([Status] = 'Received' AND [ReceivedAt] IS NOT NULL)");
        });
        purchase.HasKey(p => p.Id);
        purchase.Property(p => p.Status).HasConversion<string>().HasMaxLength(10);
        purchase.Property(p => p.Total).HasPrecision(18, 2);
        purchase.HasOne(p => p.Supplier).WithMany().HasForeignKey(p => p.SupplierId).OnDelete(DeleteBehavior.Restrict);

        var detail = modelBuilder.Entity<PurchaseDetail>();
        detail.ToTable("PurchaseDetails", table => {
            table.HasCheckConstraint("CK_PurchaseDetails_Quantity", "[Quantity] BETWEEN 1 AND 1000000");
            table.HasCheckConstraint("CK_PurchaseDetails_UnitCost", "[UnitCost] >= 0");
            table.HasCheckConstraint("CK_PurchaseDetails_Subtotal", "[Subtotal] = [Quantity] * [UnitCost]");
        });
        detail.HasKey(d => d.Id);
        detail.Property(d => d.UnitCost).HasPrecision(10, 2);
        detail.Property(d => d.Subtotal).HasPrecision(18, 2);
        detail.HasOne(d => d.Purchase).WithMany(p => p.Details).HasForeignKey(d => d.PurchaseId).OnDelete(DeleteBehavior.Restrict);
        detail.HasOne(d => d.Product).WithMany().HasForeignKey(d => d.ProductId).OnDelete(DeleteBehavior.Restrict);
        detail.HasIndex(d => new { d.PurchaseId, d.ProductId }).IsUnique();
    }
}
