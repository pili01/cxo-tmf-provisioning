using ConductorSharp.Engine;
using ConductorSharp.Engine.Builders.Metadata;
using CxoTraining.Application.Services;
using MediatR;
using System;
using System.Collections.Generic;
using System.Security.AccessControl;
using System.Text;
using System.Text.Json.Nodes;
using TmfApiClients.ResourceOrderingManagement.v4;

namespace CxoTraining.Application.Workers;

public record SubmitResourceInput() : IRequest<SubmitResourceOutput>
{
    public string FileName { get; init; }
    public string ServiceId { get; init; }
}

public record SubmitResourceOutput();

[OriginalName("SubmitResourceWorker")]
public class SubmitResourceOrderWorker(IResourceOrderingManagement4ApiClient _resourceOrdering, IResourceSpecificationService _specificationService) : TaskRequestHandler<SubmitResourceInput, SubmitResourceOutput>
{
    public override async Task<SubmitResourceOutput> Handle(SubmitResourceInput request, CancellationToken cancellationToken)
    {
        var specification = await _specificationService.GetResourceSpecificationByNameAsync("Nginx server", cancellationToken);
        var characteristics = new List<Characteristic>();
        characteristics.Add(new Characteristic { Name = "fileName", Value = JsonValue.Create(request.FileName) });

        var create = new ResourceOrder_Create
        {
            ExternalId = Guid.NewGuid().ToString(),
            Description = $"Order for {request.FileName}",
            OrderItem =
            [
                new ResourceOrderItem
                {
                    Id = Guid.NewGuid().ToString(),
                    Action = OrderItemActionType.Add,
                    State = ResourceOrderItemStateType.Initial,
                    Resource = new ResourceRefOrValue
                    {
                        @Type = "LogicalResource",
                        Name = "Portfolioski nginx " + request.FileName,
                        ResourceSpecification = new ResourceSpecificationRef
                        {
                            Id = specification.Id,
                            Name = specification.Name,
                            Version = specification.Version,
                        },
                    ResourceCharacteristic = characteristics
                    },
                }
            ],
            ExternalReference =
            [
                new ExternalId
                {
                    Id = request.ServiceId,
                    EntityType = "ServiceId",
                    Owner = "ServiceInventory"
                }
            ]
        };
        var resourceOrder = await _resourceOrdering.CreateResourceOrderAsync(create, cancellationToken);
        Console.WriteLine($"Resource order submitted: OrderId: {resourceOrder.Id}");
        return new SubmitResourceOutput();
    }
}
