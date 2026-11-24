namespace Solvex.Api.Entities;

public sealed class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public List<Order> Orders { get; set; } = [];
    public List<Mockup> Mockups { get; set; } = [];
}
