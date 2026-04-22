using ConductorSharp.Engine;
using ConductorSharp.Engine.Builders.Metadata;
using MediatR;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Text;

namespace CxoTraining.Application.Workers;

public record StoreHtmlWorkerInput() : IRequest<StoreHtmlWorkerOutput>
{
    public string HtmlContent { get; set; }
}

public record StoreHtmlWorkerOutput(string Path, string fileName);

[OriginalName("StoreHtmlWorker")]
public class StoreHtmlWorker(IHostEnvironment _env) : TaskRequestHandler<StoreHtmlWorkerInput, StoreHtmlWorkerOutput>
{
    public override async Task<StoreHtmlWorkerOutput> Handle(StoreHtmlWorkerInput request, CancellationToken cancellationToken)
    {
        var fileName = Guid.NewGuid().ToString("N")[..8];
        var outputDir = Path.Combine(_env.ContentRootPath, "DeployedPages");
        Directory.CreateDirectory(outputDir);

        var filePath = Path.Combine(outputDir, fileName + ".html");
        System.IO.File.WriteAllText(filePath, request.HtmlContent);
        return new StoreHtmlWorkerOutput(filePath, fileName);
    }
}
