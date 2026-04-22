using System;
using System.Collections.Generic;
using System.Text;
using TmfApiClients.ServiceCatalogManagement.v4;

namespace CxoTraining.Application.Services;

public interface IServiceSpecificationService
{
    Task<ServiceSpecification> GetServiceSpecificationByNameAsync(
        string name,
        CancellationToken cancellationToken = default,
        string? version = "1",
        IList<string>? lifecycleStatuses = null);
}

public class ServiceSpecificationService(IServiceCatalogManagement4ApiClient _serviceCatalog) : IServiceSpecificationService
{
    public async Task<ServiceSpecification> GetServiceSpecificationByNameAsync(
        string name,
        CancellationToken cancellationToken = default,
        string? version = "1",
        IList<string>? lifecycleStatuses = null)
    {
        var query = new ListServiceSpecificationsQueryParams
        {
            Name = name,
            Limit = 10,
            Offset = 0,
        };
        if (lifecycleStatuses != null)
            query.LifecycleStatusList = lifecycleStatuses;
        if (version != null)
            query.Version = [version];

        var resoult = await _serviceCatalog.ListServiceSpecificationsAsync(query, cancellationToken);
        var list = resoult?.Items ?? [];

        var specifications = list.Where(s => string.Equals(s.Name, name, StringComparison.OrdinalIgnoreCase)).ToList();

        if (specifications == null || !specifications.Any())
            throw new Exception($"Service specification with name '{name}' not found in Catalog.");
        if (specifications.Count > 1)
            throw new Exception($"Multiple service specifications with name '{name}' found.");

        return specifications.Single();
    }
}
