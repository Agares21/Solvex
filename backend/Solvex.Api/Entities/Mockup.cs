namespace Solvex.Api.Entities;

public enum MockupStatus { Requested = 1, InProgress = 2, Completed = 3, Delivered = 4, Cancelled = 5 }

public sealed class Mockup
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public string Institution { get; set; } = "";
    public string Type { get; set; } = "";
    public string Size { get; set; } = "";
    public DateTimeOffset DeliveryAt { get; set; }
    public string? Observations { get; set; }
    public decimal AgreedPrice { get; set; }
    public MockupStatus Status { get; set; } = MockupStatus.Requested;
    public DateTimeOffset RequestedAt { get; set; }
    public DateTimeOffset StatusUpdatedAt { get; set; }
    public List<MockupPayment> Payments { get; set; } = [];
}

public sealed class MockupPayment
{
    public int Id { get; set; }
    public int MockupId { get; set; }
    public Mockup Mockup { get; set; } = null!;
    public decimal Amount { get; set; }
    public DateTimeOffset PaidAt { get; set; }
    public string? Note { get; set; }
}
