namespace Solvex.Api.Entities;

public enum PurchaseStatus { Pending = 1, Received = 2 }

public sealed class Purchase
{
    public int Id { get; set; }
    public int SupplierId { get; set; }
    public Supplier Supplier { get; set; } = null!;
    public DateTimeOffset RegisteredAt { get; set; }
    public DateTimeOffset? ReceivedAt { get; set; }
    public PurchaseStatus Status { get; set; } = PurchaseStatus.Pending;
    public decimal Total { get; set; }
    public List<PurchaseDetail> Details { get; set; } = [];
}

public sealed class PurchaseDetail
{
    public int Id { get; set; }
    public int PurchaseId { get; set; }
    public Purchase Purchase { get; set; } = null!;
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal Subtotal { get; set; }
}
