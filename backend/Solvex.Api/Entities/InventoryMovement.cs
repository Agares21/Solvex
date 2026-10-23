namespace Solvex.Api.Entities;

public enum MovementType { Entry = 1, Exit = 2 }

public sealed class InventoryMovement
{
    public long Id { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public MovementType Type { get; set; }
    public int Quantity { get; set; }
    public string Reason { get; set; } = "";
    public DateTimeOffset RegisteredAt { get; set; }
}
