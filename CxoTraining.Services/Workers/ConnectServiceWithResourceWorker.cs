using ConductorSharp.Engine;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;
using TmfApiClients.ResourceInventoryManagement.v4;
using TmfApiClients.ResourceOrderingManagement.v4;
using TmfApiClients.ServiceInventoryManagement.v4;
using TmfApiClients.ServiceOrderingManagement.v4;
using ApiClientCommons;
using ApiClientCommons.Utilities;

namespace CxoTraining.Application.Workers;

public class ConnectServiceWithResourceInput : IRequest<ConnectServiceWithResourceOutput>
{
    public string OrderId { get; set; }
    public string ResourceId { get; set; }
}

public class ConnectServiceWithResourceOutput
{
}


public class ConnectServiceWithResourceWorker(IServiceInventoryManagement4ApiClient _serviceInventory, IResourceInventoryManagement4ApiClient _resourceInventory, IResourceOrderingManagement4ApiClient _rom) : TaskRequestHandler<ConnectServiceWithResourceInput, ConnectServiceWithResourceOutput>
{
    public override async Task<ConnectServiceWithResourceOutput> Handle(ConnectServiceWithResourceInput input, CancellationToken cancellationToken)
    {
        var resourceOrder = await _rom.GetResourceOrderAsync(input.OrderId, cancellationToken);
        
        var serviceId = resourceOrder.ExternalReference?.FirstOrDefault(
            x => x.EntityType == "ServiceId" && x.Owner == "ServiceInventory")?.Id;

        if (string.IsNullOrEmpty(serviceId)) throw new Exception("Service id not found in resource order external reference");

        var service = await _serviceInventory.GetServiceAsync(serviceId, cancellationToken);
        service.SupportingResource ??= [];

        var resourceQuery = await _resourceInventory.ListResourcesAsync(
            new() { RelatedResourceOrderItemResourceOrderId = [input.OrderId], },
            cancellationToken
            );

        foreach (var resource in resourceQuery.Items)
        {
            service.SupportingResource.Add(
                new()
                {
                    Id = resource.Id,
                    Href = resource.Href,
                    Name = resource.Name
                });
        }

        await _serviceInventory.MergePatchServiceAsync(
            serviceId,
            new Partial<Service_Update>
            {
                Data = new Service_Update { SupportingResource = service.SupportingResource },
                DefinedKeys = ["supportingResource"]
            },
            cancellationToken
            );
        return new ConnectServiceWithResourceOutput();
    }
}
