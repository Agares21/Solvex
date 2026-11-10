using System.ComponentModel.DataAnnotations;
using Solvex.Api.DTOs;
using Solvex.Api.Entities;
using Solvex.Api.Repositories;
using Solvex.Api.Services;
using Xunit;

namespace Solvex.Api.Tests;

public sealed class SupplierServiceTests
{
    private readonly FakeSuppliers repository = new();
    private SupplierService Service => new(repository);
    private static SupplierInput Valid(string name = "Papelería Norte", string identifier = " prov-01 ") => new() { Name = name, Identifier = identifier, Phone = "+591 77777777" };
    [Fact]
    public async Task Create_NormalizesAndPersists()
    {
        var result = await Service.CreateAsync(Valid());
        Assert.Equal("PROV-01", result.Identifier);
        Assert.Equal("Papelería Norte", result.Name);
        Assert.Equal(result.Id, Assert.Single(repository.Items).Id);
    }
    [Theory]
    [InlineData("", "Identificador")]
    [InlineData("Nombre", "   ")]
    public async Task RequiredFields_AreValidated(string name, string identifier) =>
        await Assert.ThrowsAsync<ValidationException>(() => Service.CreateAsync(Valid(name, identifier)));
    [Fact]
    public async Task InvalidContact_IsRejected()
    {
        await Assert.ThrowsAsync<ValidationException>(() => Service.CreateAsync(new() { Name = "Proveedor", Identifier = "A" }));
        await Assert.ThrowsAsync<ValidationException>(() => Service.CreateAsync(new() { Name = "Proveedor", Identifier = "A", Email = "incorrecto" }));
        await Assert.ThrowsAsync<ValidationException>(() => Service.CreateAsync(new() { Name = "Proveedor", Identifier = "A", Phone = "abc" }));
        Assert.Empty(repository.Items);
    }
    [Fact]
    public async Task ExcessiveLength_IsRejected() => await Assert.ThrowsAsync<ValidationException>(() => Service.CreateAsync(Valid(new string('A', 151))));
    [Fact]
    public async Task DuplicateIdentifier_IsRejected()
    {
        await Service.CreateAsync(Valid());
        await Assert.ThrowsAsync<DuplicateSupplierIdentifierException>(() => Service.CreateAsync(Valid("Otro", "PROV-01")));
        Assert.Single(repository.Items);
    }
    [Fact]
    public async Task GetById_AndMissingSupplier()
    {
        var result = await Service.CreateAsync(Valid());
        Assert.Equal(result, await Service.GetAsync(result.Id));
        await Assert.ThrowsAsync<SupplierNotFoundException>(() => Service.GetAsync(999));
    }
    [Fact]
    public async Task Search_ByNameAndIdentifier()
    {
        await Service.CreateAsync(Valid());
        await Service.CreateAsync(Valid("Distribuidora Sur", "SUR-02"));
        Assert.Equal("PROV-01", Assert.Single(await Service.ListAsync(" Norte ")).Identifier);
        Assert.Equal("SUR-02", Assert.Single(await Service.ListAsync("sur-02")).Identifier);
        Assert.Empty(await Service.ListAsync("inexistente"));
        Assert.Equal(2, (await Service.ListAsync()).Count);
        await Assert.ThrowsAsync<ValidationException>(() => Service.ListAsync(new string('A', 151)));
    }
    private sealed class FakeSuppliers : ISupplierRepository
    {
        public List<Supplier> Items { get; } = [];
        public Task<List<Supplier>> ListAsync(string? search, CancellationToken ct) => Task.FromResult(Items.Where(s => string.IsNullOrWhiteSpace(search) || s.Name.Contains(search, StringComparison.OrdinalIgnoreCase) || s.Identifier.Contains(search, StringComparison.OrdinalIgnoreCase)).ToList());
        public Task<Supplier?> FindAsync(int id, CancellationToken ct) => Task.FromResult(Items.SingleOrDefault(s => s.Id == id));
        public Task<bool> IdentifierExistsAsync(string identifier, CancellationToken ct) => Task.FromResult(Items.Any(s => s.Identifier == identifier));
        public Task AddAsync(Supplier supplier, CancellationToken ct) { supplier.Id = Items.Count + 1; Items.Add(supplier); return Task.CompletedTask; }
    }
}
