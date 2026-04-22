using ConductorSharp.Engine;
using ConductorSharp.Engine.Builders.Metadata;
using CxoTraining.Application.Models;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;
using TmfApiClients.ServiceInventoryManagement.v4;
using TmfApiClients.ServiceOrderingManagement.v4;

namespace CxoTraining.Application.Workers;

public record ValidateCharacteristicsInput() : IRequest<ValidateCharacteristicsOutput>
{
    public string ServiceId { get; init; }
}

public record ValidateCharacteristicsOutput(string? TemplateId, string? Email, string? CategoryId, ServiceOrderData Characteristics);


[OriginalName("ValidateCharacteristicsWorker")]
public class ValidateCharacteristicsWorker(IServiceInventoryManagement4ApiClient _serviceInventory) : TaskRequestHandler<ValidateCharacteristicsInput, ValidateCharacteristicsOutput>
{
    public override async Task<ValidateCharacteristicsOutput> Handle(ValidateCharacteristicsInput request, CancellationToken cancellationToken)
    {
        var service = await _serviceInventory.GetServiceAsync(request.ServiceId, cancellationToken).ConfigureAwait(false);
        ServiceOrderData characteristics = new ServiceOrderData { Characteristics = service.ServiceCharacteristic };

        var errors = new List<string>();
        var templateIdCharacteristic = characteristics.Characteristics.FirstOrDefault(c => string.Equals(c.Name, "templateId", StringComparison.OrdinalIgnoreCase));
        var emailCharacteristic = characteristics.Characteristics.FirstOrDefault(c => string.Equals(c.Name, "email", StringComparison.OrdinalIgnoreCase));
        var categoryIdCharacteristic = characteristics.Characteristics.FirstOrDefault(c => string.Equals(c.Name, "categoryId", StringComparison.OrdinalIgnoreCase));

        foreach (var characteristic in characteristics.Characteristics)
        {
            if (string.IsNullOrWhiteSpace(characteristic.Name))
            {
                errors.Add("Characteristic name cannot be empty.");
            }
            if (string.IsNullOrWhiteSpace(characteristic.Value.ToString()))
            {
                errors.Add($"Characteristic '{characteristic.Name}' value cannot be empty.");
            }
        }
        if (templateIdCharacteristic?.Value == null)
            errors.Add("Missing required characteristic: templateId.");
        if (emailCharacteristic?.Value == null)
            errors.Add("Missing required characteristic: email.");
        if (categoryIdCharacteristic?.Value == null)
            errors.Add("Missing required characteristic: categoryId.");

        if (errors.Count > 0)
            throw new Exception("Validation failed: " + string.Join(';', errors));
        return new ValidateCharacteristicsOutput(templateIdCharacteristic?.Value.ToString(), emailCharacteristic?.Value.ToString(), categoryIdCharacteristic?.Value.ToString(), characteristics);
    }
}
