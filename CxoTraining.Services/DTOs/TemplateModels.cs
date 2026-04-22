namespace CxoTraining.Application.Models;

public class TemplateFieldDto
{
    public string Name { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Type { get; set; } = "text";
    public bool Required { get; set; }
    public string? Placeholder { get; set; }
    public string? DefaultValue { get; set; }
}

public class PageTemplateDto
{
    public string Id { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Thumbnail { get; set; } = string.Empty;
    public List<TemplateFieldDto> Fields { get; set; } = new();
    public string HtmlTemplate { get; set; } = string.Empty;
}

public class DeployRequest
{
    public string TemplateId { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public Dictionary<string, string> Fields { get; set; } = new();
}

public class DeployResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class ServiceOrderData
{
    public List<TmfApiClients.ServiceInventoryManagement.v4.Characteristic> Characteristics { get; set; } = new();

    public Dictionary<string, string> ConvertToDictionary()
    {
        var dict = new Dictionary<string, string>();
        foreach (var c in Characteristics)
        {
            dict[c.Name] = c.Value.ToString();
        }
        return dict;
    }
}