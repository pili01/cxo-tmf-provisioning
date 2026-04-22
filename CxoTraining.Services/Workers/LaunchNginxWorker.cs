using ConductorSharp.Engine;
using ConductorSharp.Engine.Builders.Metadata;
using CxoTraining.Application.Services;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;
using TmfApiClients.ResourceInventoryManagement.v4;
using TmfApiClients.ResourceOrderingManagement.v4;

namespace CxoTraining.Application.Workers;

public record LaunchNginxWorkerInput : IRequest<LaunchNginxWorkerOutput>
{
    public string ResourceId { get; set; }
}

public record LaunchNginxWorkerOutput
{
    public string Url { get; set; }
}

[OriginalName("LaunchNginxWorker")]
public class LaunchNginxWorker(INginxDeployer nginxDeployer, IResourceInventoryManagement4ApiClient _resourceInventory) : TaskRequestHandler<LaunchNginxWorkerInput, LaunchNginxWorkerOutput>
{
    public override async Task<LaunchNginxWorkerOutput> Handle(LaunchNginxWorkerInput request, CancellationToken cancellationToken)
    {
        var resource = await _resourceInventory.GetResourceAsync(request.ResourceId, cancellationToken).ConfigureAwait(false);

        if (resource.ResourceCharacteristic == null)
            throw new Exception("Resource not found");

        var fileNameCharactersistics = resource.ResourceCharacteristic.Find(c => string.Equals(c.Name, "fileName", StringComparison.OrdinalIgnoreCase));

        if (fileNameCharactersistics == null)
            throw new Exception("filename not found in characteristics");

        var url = await nginxDeployer.DeployHtmlSite(fileNameCharactersistics.Value + ".html".ToString());
        return new LaunchNginxWorkerOutput { Url = url };
    }
}
