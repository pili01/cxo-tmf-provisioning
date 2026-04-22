using System;
using System.Collections.Generic;
using System.Text;
using TmfApiClients.ResourceCatalogManagement.v4;

namespace CxoTraining.Application.Services;

public interface IResourceSpecificationService
{
    Task<ResourceSpecification> GetResourceSpecificationByNameAsync(string name, CancellationToken cancellationToken = default);
}

public class ResourceSpecificationService(IResourceCatalogManagement4ApiClient _resourceCatalog) : IResourceSpecificationService
{
    public async Task<ResourceSpecification> GetResourceSpecificationByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        var query = new ListResourceSpecificationsQueryParams
        {
            Name = name,
            Limit = 10,
            Offset = 0,
        };

        var result = await _resourceCatalog.ListResourceSpecificationsAsync(query, cancellationToken);
        var list = result?.Items ?? [];

        var specifications = list.Where(s => string.Equals(s.Name, name, StringComparison.OrdinalIgnoreCase)).ToList();

        if (!specifications.Any())
            throw new Exception($"Resource specification with name '{name}' not found in Catalog.");
        if (specifications.Count > 1)
            throw new Exception($"Multiple resource specifications with name '{name}' found.");

        return specifications.Single();
    }
}
