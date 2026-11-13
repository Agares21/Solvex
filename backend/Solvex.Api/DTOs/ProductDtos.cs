using System.ComponentModel.DataAnnotations;

namespace Solvex.Api.DTOs;

public sealed record ProductInput
{
    public ProductInput() { }
    public ProductInput(string code, string name, string? description, decimal? price)
    { Code = code; Name = name; Description = description; Price = price; }

    [Required, StringLength(40)]
    public string Code { get; init; } = "";
    [Required, StringLength(150)]
    public string Name { get; init; } = "";
    [StringLength(1000)]
    public string? Description { get; init; }
    [Required, Range(typeof(decimal), "0", "99999999.99", ParseLimitsInInvariantCulture = true)]
    public decimal? Price { get; init; }
}

public sealed record ProductDto(int Id, string Code, string Name, string? Description, decimal Price, bool IsActive);
