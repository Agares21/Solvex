using System.ComponentModel.DataAnnotations;
using Solvex.Api.DTOs;
using Solvex.Api.Entities;
using Solvex.Api.Repositories;
using Solvex.Api.Services;
using Xunit;

namespace Solvex.Api.Tests;

public sealed class ProductServiceTests
{
    private readonly FakeRepository repository = new();
    private ProductService Service => new(repository);
    private static ProductInput Valid => new(" LIB-01 ", " Cuaderno ", "Rayado", 12.50m);

    [Fact]
    public async Task Create_NormalizesAndPersists()
    {
        var result = await Service.CreateAsync(Valid);
        Assert.True(result.IsActive);
        Assert.Equal("LIB-01", result.Code);
        Assert.Equal("Cuaderno", result.Name);
        Assert.Equal(12.50m, Assert.Single(repository.Items).Price);
        Assert.Equal(1, repository.Saves);
    }
    [Theory]
    [InlineData("", "Cuaderno", 1)]
    [InlineData("A", "   ", 1)]
    [InlineData("A", "Cuaderno", -1)]
    [InlineData("A", "Cuaderno", 1.001)]
    public async Task Create_RejectsInvalidData(string code, string name, double price)
    {
        await Assert.ThrowsAsync<ValidationException>(() => Service.CreateAsync(new(code, name, null, (decimal)price)));
        Assert.Empty(repository.Items);
        Assert.Equal(0, repository.Saves);
    }
    [Fact]
    public async Task Create_RequiresPrice() => await Assert.ThrowsAsync<ValidationException>(() => Service.CreateAsync(Valid with { Price = null }));
    [Theory]
    [InlineData(41, 10, 10)]
    [InlineData(10, 151, 10)]
    [InlineData(10, 10, 1001)]
    public async Task Create_RejectsExcessiveLengths(int codeLength, int nameLength, int descriptionLength) =>
        await Assert.ThrowsAsync<ValidationException>(() => Service.CreateAsync(new(new string('A', codeLength), new string('N', nameLength), new string('D', descriptionLength), 1)));
    [Fact]
    public async Task Create_RejectsDuplicateCode()
    {
        await Service.CreateAsync(Valid);
        await Assert.ThrowsAsync<DuplicateProductCodeException>(() => Service.CreateAsync(Valid with { Code = "lib-01" }));
        Assert.Single(repository.Items);
    }
    [Fact]
    public async Task Get_ReturnsProduct()
    {
        var created = await Service.CreateAsync(Valid);
        Assert.Equal(created, await Service.GetAsync(created.Id));
    }
    [Fact]
    public async Task MissingProduct_IsReportedForAllOperations()
    {
        await Assert.ThrowsAsync<ProductNotFoundException>(() => Service.GetAsync(999));
        await Assert.ThrowsAsync<ProductNotFoundException>(() => Service.UpdateAsync(999, Valid));
        await Assert.ThrowsAsync<ProductNotFoundException>(() => Service.DeactivateAsync(999));
        await Assert.ThrowsAsync<ProductNotFoundException>(() => Service.ActivateAsync(999));
    }
    [Fact]
    public async Task Update_ChangesFieldsAndPreservesId()
    {
        var created = await Service.CreateAsync(Valid);
        var changed = await Service.UpdateAsync(created.Id, Valid with { Name = "Lápiz", Price = 3 });
        Assert.Equal(created.Id, changed.Id);
        Assert.Equal("Lápiz", changed.Name);
        Assert.Equal(3m, changed.Price);
        Assert.Single(repository.Items);
    }
    [Fact]
    public async Task Update_RejectsDuplicateWithoutChangingProduct()
    {
        var first = await Service.CreateAsync(Valid);
        var second = await Service.CreateAsync(Valid with { Code = "LIB-02" });
        await Assert.ThrowsAsync<DuplicateProductCodeException>(() => Service.UpdateAsync(second.Id, Valid));
        Assert.Equal("LIB-02", (await Service.GetAsync(second.Id)).Code);
        Assert.Equal("LIB-01", first.Code);
    }
    [Fact]
    public async Task Deactivate_PreservesProductAndIsIdempotent()
    {
        var created = await Service.CreateAsync(Valid);
        await Service.DeactivateAsync(created.Id);
        await Service.DeactivateAsync(created.Id);
        Assert.False((await Service.GetAsync(created.Id)).IsActive);
        Assert.False(Assert.Single(await Service.ListAsync()).IsActive);
        Assert.Single(repository.Items);
        var edited = await Service.UpdateAsync(created.Id, Valid with { Price = 0 });
        Assert.False(edited.IsActive);
    }
    [Fact]
    public async Task Activate_PreservesStockAndIsIdempotent()
    {
        var created = await Service.CreateAsync(Valid);
        repository.Items[0].Stock = 8;
        await Service.DeactivateAsync(created.Id);
        await Service.ActivateAsync(created.Id);
        await Service.ActivateAsync(created.Id);
        Assert.True((await Service.GetAsync(created.Id)).IsActive);
        Assert.Equal(8, Assert.Single(repository.Items).Stock);
        Assert.Equal(created.Code, repository.Items[0].Code);
    }
    private sealed class FakeRepository : IProductRepository
    {
        public List<Product> Items { get; } = [];
        public int Saves { get; private set; }
        public Task<List<Product>> ListAsync(CancellationToken ct) => Task.FromResult(Items.ToList());
        public Task<Product?> FindAsync(int id, CancellationToken ct) => Task.FromResult(Items.SingleOrDefault(p => p.Id == id));
        public Task<bool> CodeExistsAsync(string code, int? exceptId, CancellationToken ct) => Task.FromResult(Items.Any(p => p.Code == code && p.Id != exceptId));
        public Task AddAsync(Product product, CancellationToken ct) { product.Id = Items.Count + 1; Items.Add(product); return Task.CompletedTask; }
        public Task SaveAsync(CancellationToken ct) { Saves++; return Task.CompletedTask; }
    }
}
