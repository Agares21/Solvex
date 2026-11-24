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
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderDetail> OrderDetails => Set<OrderDetail>();
    public DbSet<Mockup> Mockups => Set<Mockup>();
    public DbSet<MockupPayment> MockupPayments => Set<MockupPayment>();
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
        product.Property<string>("NormalizedName").HasMaxLength(150).IsRequired()
            .HasComputedColumnSql("UPPER(LTRIM(RTRIM([Name]))) COLLATE Latin1_General_100_CI_AS", stored: true);
        product.HasIndex("NormalizedName").IsUnique();
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

        var customer = modelBuilder.Entity<Customer>();
        customer.ToTable("Customers");
        customer.HasKey(c => c.Id);
        customer.Property(c => c.Name).HasMaxLength(150).IsRequired();
        customer.Property(c => c.Phone).HasMaxLength(40);
        customer.Property(c => c.Email).HasMaxLength(254);
        customer.HasIndex(c => c.Name);

        var order = modelBuilder.Entity<Order>();
        order.ToTable("Orders", table => {
            table.HasCheckConstraint("CK_Orders_Total", "[Total] >= 0");
            table.HasCheckConstraint("CK_Orders_Status", "[Status] IN ('Pending', 'InProgress', 'Delivered')");
        });
        order.HasKey(o => o.Id);
        order.Property(o => o.Status).HasConversion<string>().HasMaxLength(10);
        order.Property(o => o.Observations).HasMaxLength(1000);
        order.Property(o => o.Total).HasPrecision(18, 2);
        order.HasOne(o => o.Customer).WithMany(c => c.Orders).HasForeignKey(o => o.CustomerId).OnDelete(DeleteBehavior.Restrict);
        order.HasIndex(o => new { o.CustomerId, o.RegisteredAt, o.Id });

        var orderDetail = modelBuilder.Entity<OrderDetail>();
        orderDetail.ToTable("OrderDetails", table => {
            table.HasCheckConstraint("CK_OrderDetails_Quantity", "[Quantity] BETWEEN 1 AND 1000000");
            table.HasCheckConstraint("CK_OrderDetails_UnitPrice", "[UnitPrice] >= 0");
            table.HasCheckConstraint("CK_OrderDetails_Subtotal", "[Subtotal] = [Quantity] * [UnitPrice]");
        });
        orderDetail.HasKey(d => d.Id);
        orderDetail.Property(d => d.UnitPrice).HasPrecision(10, 2);
        orderDetail.Property(d => d.Subtotal).HasPrecision(18, 2);
        orderDetail.HasOne(d => d.Order).WithMany(o => o.Details).HasForeignKey(d => d.OrderId).OnDelete(DeleteBehavior.Restrict);
        orderDetail.HasOne(d => d.Product).WithMany().HasForeignKey(d => d.ProductId).OnDelete(DeleteBehavior.Restrict);
        orderDetail.HasIndex(d => new { d.OrderId, d.ProductId }).IsUnique();

        var mockup = modelBuilder.Entity<Mockup>();
        mockup.ToTable("Mockups", table => {
            table.HasCheckConstraint("CK_Mockups_AgreedPrice", "[AgreedPrice] > 0");
            table.HasCheckConstraint("CK_Mockups_Status", "[Status] IN ('Requested', 'InProgress', 'Completed')");
        });
        mockup.HasKey(m => m.Id);
        mockup.Property(m => m.Institution).HasMaxLength(150).IsRequired();
        mockup.Property(m => m.Type).HasMaxLength(100).IsRequired();
        mockup.Property(m => m.Size).HasMaxLength(40).IsRequired();
        mockup.Property(m => m.Observations).HasMaxLength(1000);
        mockup.Property(m => m.AgreedPrice).HasPrecision(10, 2);
        mockup.Property(m => m.Status).HasConversion<string>().HasMaxLength(20);
        mockup.HasOne(m => m.Customer).WithMany(c => c.Mockups).HasForeignKey(m => m.CustomerId).OnDelete(DeleteBehavior.Restrict);
        mockup.HasIndex(m => new { m.CustomerId, m.RequestedAt, m.Id });

        var payment = modelBuilder.Entity<MockupPayment>();
        payment.ToTable("MockupPayments", table => table.HasCheckConstraint("CK_MockupPayments_Amount", "[Amount] > 0"));
        payment.HasKey(p => p.Id);
        payment.Property(p => p.Amount).HasPrecision(10, 2);
        payment.Property(p => p.Note).HasMaxLength(300);
        payment.HasOne(p => p.Mockup).WithMany(m => m.Payments).HasForeignKey(p => p.MockupId).OnDelete(DeleteBehavior.Restrict);
        payment.HasIndex(p => new { p.MockupId, p.PaidAt, p.Id });
    }
}
