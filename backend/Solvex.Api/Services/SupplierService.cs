using System.ComponentModel.DataAnnotations;
using Solvex.Api.DTOs;
using Solvex.Api.Entities;
using Solvex.Api.Repositories;

namespace Solvex.Api.Services;

public sealed class SupplierNotFoundException() : Exception("El proveedor no existe.");
public sealed class DuplicateSupplierIdentifierException() : Exception("Ya existe un proveedor con ese identificador.");

public sealed class SupplierService(ISupplierRepository repository)
{
    public async Task<IReadOnlyList<SupplierDto>> ListAsync(string? search = null, CancellationToken ct = default)
    {
        if (search?.Length > 150) throw new ValidationException("La búsqueda admite hasta 150 caracteres.");
        return (await repository.ListAsync(search?.Trim(), ct)).Select(Map).ToList();
    }
    public async Task<SupplierDto> GetAsync(int id, CancellationToken ct = default) => Map(await repository.FindAsync(id, ct) ?? throw new SupplierNotFoundException());
    public async Task<SupplierDto> CreateAsync(SupplierInput input, CancellationToken ct = default)
    {
        Validator.ValidateObject(input, new ValidationContext(input), true);
        var supplier = new Supplier { Identifier = input.Identifier.Trim().ToUpperInvariant(), Name = input.Name.Trim(),
            ContactName = Clean(input.ContactName), Phone = Clean(input.Phone), Email = Clean(input.Email), Address = Clean(input.Address) };
        if (supplier.Identifier.Length == 0 || supplier.Name.Length == 0) throw new ValidationException("El identificador y el nombre son obligatorios.");
        if (supplier.Phone is null && supplier.Email is null) throw new ValidationException("Registra al menos un teléfono o correo de contacto.");
        if (await repository.IdentifierExistsAsync(supplier.Identifier, ct)) throw new DuplicateSupplierIdentifierException();
        await repository.AddAsync(supplier, ct);
        return Map(supplier);
    }
    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static SupplierDto Map(Supplier s) => new(s.Id, s.Identifier, s.Name, s.ContactName, s.Phone, s.Email, s.Address);
}
