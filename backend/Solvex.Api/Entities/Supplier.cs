namespace Solvex.Api.Entities;

public sealed class Supplier
{
    public int Id { get; set; }
    public string Identifier { get; set; } = "";
    public string Name { get; set; } = "";
    public string? ContactName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
}
