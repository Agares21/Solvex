using System.ComponentModel.DataAnnotations;
using Solvex.Api.DTOs;
using Solvex.Api.Entities;
using Solvex.Api.Repositories;

namespace Solvex.Api.Services;

public sealed class MockupNotFoundException() : Exception("La maqueta no existe.");
public sealed class PaymentConflictException(string message) : Exception(message);
public sealed class MockupStatusConflictException(string message) : Exception(message);

public interface IMockupService
{
    Task<IReadOnlyList<MockupSummaryDto>> ListAsync(CancellationToken ct = default);
    Task<MockupDto> GetAsync(int id, CancellationToken ct = default);
    Task<MockupDto> CreateAsync(MockupInput input, CancellationToken ct = default);
    Task<MockupDto> AddPaymentAsync(int id, MockupPaymentInput input, CancellationToken ct = default);
    Task<MockupDto> UpdateStatusAsync(int id, MockupStatusInput input, CancellationToken ct = default);
}

public sealed class MockupService(IMockupRepository repository) : IMockupService
{
    public async Task<IReadOnlyList<MockupSummaryDto>> ListAsync(CancellationToken ct = default) => (await repository.ListAsync(ct)).Select(MapSummary).ToList();
    public async Task<MockupDto> GetAsync(int id, CancellationToken ct = default) => Map(await repository.FindAsync(id, ct) ?? throw new MockupNotFoundException());
    public async Task<MockupDto> CreateAsync(MockupInput input, CancellationToken ct = default)
    {
        Validate(input);
        if (!await repository.CustomerExistsAsync(input.CustomerId, ct)) throw new CustomerNotFoundException();
        var now = DateTimeOffset.UtcNow;
        var mockup = new Mockup { CustomerId = input.CustomerId, Institution = input.Institution.Trim(), Type = input.Type.Trim(), Size = input.Size.Trim(),
            DeliveryAt = input.DeliveryAt!.Value, Observations = Clean(input.Observations), AgreedPrice = input.AgreedPrice!.Value, RequestedAt = now, StatusUpdatedAt = now };
        if (mockup.Institution.Length == 0 || mockup.Type.Length == 0 || mockup.Size.Length == 0)
            throw new ValidationException("La institución, tipo y tamaño de la maqueta son obligatorios.");
        if (mockup.DeliveryAt <= now) throw new ValidationException("La fecha de entrega debe ser futura.");
        return Map(await repository.AddAsync(mockup, ct));
    }
    public async Task<MockupDto> AddPaymentAsync(int id, MockupPaymentInput input, CancellationToken ct = default)
    {
        Validator.ValidateObject(input, new ValidationContext(input), true);
        if (decimal.Round(input.Amount!.Value, 2) != input.Amount.Value) throw new ValidationException("El importe admite como máximo dos decimales.");
        return Map(await repository.AddPaymentAsync(id, input.Amount.Value, Clean(input.Note), ct));
    }
    public async Task<MockupDto> UpdateStatusAsync(int id, MockupStatusInput input, CancellationToken ct = default)
    {
        Validator.ValidateObject(input, new ValidationContext(input), true);
        var mockup = await repository.FindForUpdateAsync(id, ct) ?? throw new MockupNotFoundException();
        var next = input.Status!.Value;
        if (!IsAllowed(mockup.Status, next)) throw new MockupStatusConflictException("La transición de estado de la maqueta no es válida.");
        mockup.Status = next;
        mockup.StatusUpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveAsync(ct);
        return Map(await repository.FindAsync(id, ct) ?? throw new MockupNotFoundException());
    }
    private static void Validate(MockupInput input)
    {
        Validator.ValidateObject(input, new ValidationContext(input), true);
        if (decimal.Round(input.AgreedPrice!.Value, 2) != input.AgreedPrice.Value) throw new ValidationException("El precio acordado admite como máximo dos decimales.");
    }
    private static bool IsAllowed(MockupStatus current, MockupStatus next) => (current, next) switch
    {
        (MockupStatus.Requested, MockupStatus.InProgress) => true,
        (MockupStatus.Requested, MockupStatus.Cancelled) => true,
        (MockupStatus.InProgress, MockupStatus.Completed) => true,
        (MockupStatus.InProgress, MockupStatus.Cancelled) => true,
        (MockupStatus.Completed, MockupStatus.Delivered) => true,
        _ => false
    };
    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static MockupSummaryDto MapSummary(Mockup m)
    {
        var paid = m.Payments.Sum(p => p.Amount);
        return new(m.Id, m.CustomerId, m.Customer.Name, m.Institution, m.Type, m.Size, m.DeliveryAt, m.Status, m.RequestedAt, m.AgreedPrice, paid, m.AgreedPrice - paid);
    }
    private static MockupDto Map(Mockup m)
    {
        var paid = m.Payments.Sum(p => p.Amount);
        return new(m.Id, m.CustomerId, m.Customer.Name, m.Institution, m.Type, m.Size, m.DeliveryAt, m.Observations, m.Status, m.RequestedAt, m.StatusUpdatedAt, m.AgreedPrice, paid, m.AgreedPrice - paid,
            m.Payments.OrderBy(p => p.Id).Select(p => new MockupPaymentDto(p.Id, p.Amount, p.PaidAt, p.Note)).ToList());
    }
}
