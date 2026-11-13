using Microsoft.EntityFrameworkCore;
using Solvex.Api.Data;
using Solvex.Api.Infrastructure;
using Solvex.Api.Repositories;
using Solvex.Api.Services;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(allowIntegerValues: false)));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options => {
    options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, "Solvex.Api.xml"));
    options.SupportNonNullableReferenceTypes();
    options.MapType<decimal>(() => new Microsoft.OpenApi.Models.OpenApiSchema { Type = "number", Format = "decimal" });
});
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddDbContext<SolvexDbContext>(options => options.UseSqlServer(
    builder.Configuration.GetConnectionString("Solvex") ?? throw new InvalidOperationException("Configura ConnectionStrings__Solvex o el secreto ConnectionStrings:Solvex.")));
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<InventoryRepository>();
builder.Services.AddScoped<IInventoryRepository>(sp => sp.GetRequiredService<InventoryRepository>());
builder.Services.AddScoped<IPurchaseInventory>(sp => sp.GetRequiredService<InventoryRepository>());
builder.Services.AddScoped<ISupplierRepository, SupplierRepository>();
builder.Services.AddScoped<SupplierService>();
builder.Services.AddScoped<IPurchaseRepository, PurchaseRepository>();
builder.Services.AddScoped<PurchaseService>();
builder.Services.AddScoped<InventoryService>();
builder.Services.AddScoped<IAvailabilityService, AvailabilityService>();
var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors();
if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }
app.MapControllers();
app.Run();
public partial class Program { }
