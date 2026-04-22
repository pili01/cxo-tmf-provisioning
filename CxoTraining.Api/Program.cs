using ConductorSharp.Engine.Extensions;
using CxoTraining.Application.Services;
using CxoTraining.Application.Workers;
using CxoTraining.Application.Workflows;
using TmfApiClients;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly);
    cfg.RegisterServicesFromAssembly(typeof(SubmitOrderWorker).Assembly);
});

builder.Services.AddTmfApiClients(builder.Configuration);
builder.Services.AddSingleton<ITemplateService, TemplateService>();
builder.Services.AddSingleton<IServiceSpecificationService, ServiceSpecificationService>();
builder.Services.AddSingleton<IResourceSpecificationService, ResourceSpecificationService>();
builder.Services.AddSingleton<ISendMailService, SendMailService>();
builder.Services.AddSingleton<INginxDeployer, NginxDeployer>();

builder.Services
    .AddConductorSharp(baseUrl: "http://cxo-conductor:8080")
    .AddExecutionManager(
        maxConcurrentWorkers: 10,
        sleepInterval: 1000,
        longPollInterval: 5000,
        domain: null,
        typeof(Program).Assembly
    )
    .AddPipelines(pipelines =>
    {
        pipelines.AddRequestResponseLogging();
        pipelines.AddValidation();
    });

builder.Services.RegisterWorkerTask<CreateHtmlFromCharacteristicsWorker>();
builder.Services.RegisterWorkerTask<SubmitResourceOrderWorker>();
builder.Services.RegisterWorkerTask<LaunchNginxWorker>();
builder.Services.RegisterWorkerTask<SendNotificationEmailWorker>();
builder.Services.RegisterWorkerTask<StoreHtmlWorker>();
builder.Services.RegisterWorkerTask<SubmitOrderWorker>();
builder.Services.RegisterWorkerTask<ValidateCharacteristicsWorker>();

builder.Services.RegisterWorkflow<ValidationWorkflow>();
builder.Services.RegisterWorkflow<ProvisioningServiceWorkflow>();
builder.Services.RegisterWorkflow<DeployPageWorkflow>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAngular");

app.UseStaticFiles();

app.UseAuthorization();

app.MapControllers();

app.UseSwagger();
app.UseSwaggerUI();

var deployedDir = Path.Combine(app.Environment.ContentRootPath, "DeployedPages");
Directory.CreateDirectory(deployedDir);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(deployedDir),
    RequestPath = "/deployed"
});

app.Run();
