using System.ComponentModel.DataAnnotations;
using Solvex.Api.DTOs;
using Solvex.Api.Entities;
using Solvex.Api.Repositories;

namespace Solvex.Api.Services;

public sealed class ProductNotFoundException() : Exception("El producto no existe.");
public sealed class DuplicateProductCodeException() : Exception("Ya existe un producto con ese código.");

public sealed class ProductService(IProductRepository repository)
{
    public async Task<IReadOnlyList<ProductDto>> ListAsync(CancellationToken ct = default) => (await repository.ListAsync(ct)).Select(Map).ToList();
    public async Task<ProductDto> GetAsync(int id, CancellationToken ct = default) => Map(await RequiredAsync(id, ct));
    public async Task<ProductDto> CreateAsync(ProductInput input, CancellationToken ct = default)
    {
        var normalized = Validate(input);
        await CheckCodeAsync(normalized.Code, null, ct);
        var product = new Product();
        Apply(product, normalized);
        await repository.AddAsync(product, ct);
        await repository.SaveAsync(ct);
        return Map(product);
    }
    public async Task<ProductDto> UpdateAsync(int id, ProductInput input, CancellationToken ct = default)
    {
        var normalized = Validate(input);
        var product = await RequiredAsync(id, ct);
        await CheckCodeAsync(normalized.Code, id, ct);
        Apply(product, normalized);
        await repository.SaveAsync(ct);
        return Map(product);
    }
    public async Task DeactivateAsync(int id, CancellationToken ct = default)
    {
        var product = await RequiredAsync(id, ct);
        product.IsActive = false;
        await repository.SaveAsync(ct);
    }
    private async Task<Product> RequiredAsync(int id, CancellationToken ct) => await repository.FindAsync(id, ct) ?? throw new ProductNotFoundException();
    private async Task CheckCodeAsync(string code, int? id, CancellationToken ct)
    {
        if (await repository.CodeExistsAsync(code, id, ct)) throw new DuplicateProductCodeException();
    }
    private static ProductInput Validate(ProductInput input)
    {
        Validator.ValidateObject(input, new ValidationContext(input), true);
        var normalized = input with { Code = input.Code.Trim().ToUpperInvariant(), Name = input.Name.Trim(), Description = input.Description?.Trim() };
        Validator.ValidateObject(normalized, new ValidationContext(normalized), true);
        if (decimal.Round(normalized.Price!.Value, 2) != normalized.Price.Value)
            throw new ValidationException("El precio admite como máximo dos decimales.");
        return normalized;
    }
    private static void Apply(Product p, ProductInput input) { p.Code = input.Code; p.Name = input.Name; p.Description = input.Description; p.Price = input.Price!.Value; }
    private static ProductDto Map(Product p) => new(p.Id, p.Code, p.Name, p.Description, p.Price, p.IsActive);
}
