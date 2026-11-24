using System.ComponentModel.DataAnnotations;
using Solvex.Api.Entities;

namespace Solvex.Api.DTOs;

public sealed class MockupInput
{
    [Range(1, int.MaxValue)] public int CustomerId { get; init; }
    [Required, StringLength(150)] public string Institution { get; init; } = "";
    [Required, StringLength(100)] public string Type { get; init; } = "";
    [Required, StringLength(40)] public string Size { get; init; } = "";
    [Required] public DateTimeOffset? DeliveryAt { get; init; }
    [StringLength(1000)] public string? Observations { get; init; }
    [Required, Range(typeof(decimal), "0.01", "99999999.99", ParseLimitsInInvariantCulture = true)] public decimal? AgreedPrice { get; init; }
}

public sealed class MockupPaymentInput
{
    [Required, Range(typeof(decimal), "0.01", "99999999.99", ParseLimitsInInvariantCulture = true)] public decimal? Amount { get; init; }
    [StringLength(300)] public string? Note { get; init; }
}

public sealed class MockupStatusInput
{
    [Required, EnumDataType(typeof(MockupStatus))] public MockupStatus? Status { get; init; }
}

public sealed record MockupPaymentDto(int Id, decimal Amount, DateTimeOffset PaidAt, string? Note);
public sealed record MockupSummaryDto(int Id, int CustomerId, string CustomerName, string Institution, string Type, string Size, DateTimeOffset DeliveryAt, MockupStatus Status, DateTimeOffset RequestedAt, decimal AgreedPrice, decimal TotalPaid, decimal PendingBalance);
public sealed record MockupDto(int Id, int CustomerId, string CustomerName, string Institution, string Type, string Size, DateTimeOffset DeliveryAt, string? Observations, MockupStatus Status, DateTimeOffset RequestedAt, DateTimeOffset StatusUpdatedAt, decimal AgreedPrice, decimal TotalPaid, decimal PendingBalance, IReadOnlyList<MockupPaymentDto> Payments);
