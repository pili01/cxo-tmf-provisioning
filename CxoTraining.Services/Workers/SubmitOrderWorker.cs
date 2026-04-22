using ConductorSharp.Engine;
using ConductorSharp.Engine.Builders.Metadata;
using CxoTraining.Application.Models;
using CxoTraining.Application.Services;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;
using TmfApiClients;
using TmfApiClients.CustomerManagement.v4;
using TmfApiClients.ServiceOrderingManagement.v4;

namespace CxoTraining.Application.Workers;

public record SubmitOrderInput() : IRequest<SubmitOrderOutput>
{
    public DeployRequest DeployRequest { get; init; }
}

public record SubmitOrderOutput(string OrderId);

[OriginalName("SubmitOrderWorker")]
public class SubmitOrderWorker(IServiceOrderingManagement4ApiClient _serviceOrdering, IServiceSpecificationService _specificationService) : TaskRequestHandler<SubmitOrderInput, SubmitOrderOutput>
{
    public override async Task<SubmitOrderOutput> Handle(SubmitOrderInput request, CancellationToken cancellationToken)
    {
        var specification = await _specificationService.GetServiceSpecificationByNameAsync(request.DeployRequest.CategoryId, cancellationToken);

        var characteristics = request.DeployRequest.Fields.Select(
            field => new TmfApiClients.ServiceOrderingManagement.v4.Characteristic
            {
                Name = field.Key,
                Value = field.Value
            }).ToList();
        characteristics.Add(new TmfApiClients.ServiceOrderingManagement.v4.Characteristic { Name = "templateId", Value = request.DeployRequest.TemplateId });
        characteristics.Add(new TmfApiClients.ServiceOrderingManagement.v4.Characteristic { Name = "categoryId", Value = request.DeployRequest.CategoryId });

        var create = new ServiceOrder_Create
        {
            ExternalId = Guid.NewGuid().ToString(),
            Description = $"Order for {request.DeployRequest.CategoryId}-{request.DeployRequest.TemplateId}",
            ServiceOrderItem =
            [
                new ServiceOrderItem
                {
                    Id = Guid.NewGuid().ToString(),
                    Action = OrderItemActionType.Add,
                    State = ServiceOrderItemStateType.Initial,
                    Service = new ServiceRefOrValue
                    {
                        @Type = "Service",
                        ServiceSpecification = new ServiceSpecificationRef
                        {
                            Id = specification.Id,
                            Name = specification.Name,
                            Version = specification.Version
                        },
                        ServiceCharacteristic = characteristics
                    },
                }
                ]
        };

        var serviceOrder = await _serviceOrdering.CreateServiceOrderAsync(create, cancellationToken);
        Console.WriteLine($"Order submitted: OrderId={serviceOrder.Id}");
        return new SubmitOrderOutput(serviceOrder.Id);
    }
}
