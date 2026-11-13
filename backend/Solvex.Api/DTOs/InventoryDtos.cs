using System.ComponentModel.DataAnnotations;
using Solvex.Api.Entities;

namespace Solvex.Api.DTOs;

public sealed class MovementInput
{
    [Required, EnumDataType(typeof(MovementType))]
    public MovementType? Type { get; init; }
    [Required, Range(1, int.MaxValue)]
    public int? Quantity { get; init; }
    [Required, StringLength(300)]
    public string Reason { get; init; } = "";
}

public sealed record StockDto(int ProductId, string Code, string Name, bool IsActive, int Stock);
public sealed record MovementDto(long Id, int ProductId, MovementType Type, int Quantity, string Reason, DateTimeOffset RegisteredAt);
public sealed record AdjustmentDto(MovementDto Movement, int CurrentStock);

public sealed class AvailabilityItemInput
{
    [Range(1, int.MaxValue)]
    public int ProductId { get; init; }
    [Required, Range(1, int.MaxValue)]
    public int? Quantity { get; init; }
}

public sealed class AvailabilityInput
{
    [Required, MinLength(1), MaxLength(100)]
    public List<AvailabilityItemInput> Items { get; init; } = [];
}

public sealed record AvailabilityItemDto(int ProductId, string Code, string Name, bool IsActive,
    int RequestedQuantity, int AvailableQuantity, bool IsSufficient, int MissingQuantity);
public sealed record AvailabilityDto(bool AllAvailable, IReadOnlyList<AvailabilityItemDto> Items);
