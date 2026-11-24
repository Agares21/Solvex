using System.ComponentModel.DataAnnotations;

namespace Solvex.Api.DTOs;

public sealed class CustomerInput
{
    [Required, StringLength(150)] public string Name { get; init; } = "";
    [StringLength(40), Phone] public string? Phone { get; init; }
    [StringLength(254), EmailAddress] public string? Email { get; init; }
}

public sealed record CustomerDto(int Id, string Name, string? Phone, string? Email);
public sealed record CustomerOrderHistoryDto(int Id, DateTimeOffset RegisteredAt, string Status, decimal Total);
public sealed record CustomerMockupHistoryDto(int Id, string Institution, string Type, string Status, DateTimeOffset RequestedAt, DateTimeOffset DeliveryAt, decimal AgreedPrice, decimal TotalPaid, decimal PendingBalance);
public sealed record CustomerHistoryDto(CustomerDto Customer, IReadOnlyList<CustomerOrderHistoryDto> Orders, IReadOnlyList<CustomerMockupHistoryDto> Mockups);
