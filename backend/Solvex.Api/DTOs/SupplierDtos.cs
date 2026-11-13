using System.ComponentModel.DataAnnotations;

namespace Solvex.Api.DTOs;

public sealed class SupplierInput
{
    [Required, StringLength(40)] public string Identifier { get; init; } = "";
    [Required, StringLength(150)] public string Name { get; init; } = "";
    [StringLength(150)] public string? ContactName { get; init; }
    [StringLength(40), Phone] public string? Phone { get; init; }
    [StringLength(254), EmailAddress] public string? Email { get; init; }
    [StringLength(300)] public string? Address { get; init; }
}
public sealed record SupplierDto(int Id, string Identifier, string Name, string? ContactName, string? Phone, string? Email, string? Address);
