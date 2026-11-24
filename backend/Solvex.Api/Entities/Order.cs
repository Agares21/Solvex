namespace Solvex.Api.Entities;

public enum OrderStatus { Pending = 1, InProgress = 2, Delivered = 3 }

public sealed class Order
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public DateTimeOffset RegisteredAt { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public string? Observations { get; set; }
    public decimal Total { get; set; }
    public List<OrderDetail> Details { get; set; } = [];
}

public sealed class OrderDetail
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
}
