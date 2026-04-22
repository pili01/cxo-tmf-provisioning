using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using CxoTraining.Application.Models;

namespace CxoTraining.Application.Services;

public interface ITemplateService
{
    List<PageTemplateDto> GetTemplatesByCategory(string categoryId);
    PageTemplateDto? GetTemplate(string categoryId, string templateId);
    string RenderTemplate(string categoryId, string templateId, Dictionary<string, string> fields);
}

public partial class TemplateService : ITemplateService
{
    // BaseDirectory: next to the host DLL (where MSBuild copies content); ContentRoot in VS Docker is often the project mount (/app) instead.
    private readonly string _templatePath = Path.Combine(AppContext.BaseDirectory, "Templates");
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public List<PageTemplateDto> GetTemplatesByCategory(string categoryId)
    {
        var jsonPath = Path.Combine(_templatePath, $"{categoryId}.json");
        if (!File.Exists(jsonPath))
            return [];

        var json = File.ReadAllText(jsonPath);
        var templates = JsonSerializer.Deserialize<List<PageTemplateDto>>(json, _jsonOptions) ?? [];

        foreach (var template in templates)
        {
            var htmlFile = Path.Combine(_templatePath, template.HtmlTemplate);
            if (File.Exists(htmlFile))
                template.HtmlTemplate = File.ReadAllText(htmlFile);
        }

        return templates;
    }

    public PageTemplateDto? GetTemplate(string categoryId, string templateId)
    {
        var templates = GetTemplatesByCategory(categoryId);
        return templates.Find(t => t.Id == templateId);
    }

    public string RenderTemplate(string categoryId, string templateId, Dictionary<string, string> fields)
    {
        var template = GetTemplate(categoryId, templateId);
        if (template == null)
            return string.Empty;

        var expanded = new Dictionary<string, string>(fields);
        if (string.Equals(categoryId, "portfolio", StringComparison.OrdinalIgnoreCase))
        {
            fields.TryGetValue("projects", out var projectsJson);
            expanded["projectsBlock"] = BuildProjectsBlock(projectsJson, templateId);
        }
        else
        {
            expanded["projectsBlock"] = string.Empty;
        }

        var html = template.HtmlTemplate;
        foreach (var (key, value) in expanded)
        {
            if (string.Equals(key, "projects", StringComparison.OrdinalIgnoreCase))
                continue;
            html = html.Replace($"{{{{{key}}}}}", value ?? string.Empty);
        }

        html = PlaceholderRegex().Replace(html, string.Empty);
        return html;
    }

    private static string BuildProjectsBlock(string? projectsJson, string templateId)
    {
        var isDev = string.Equals(templateId, "portfolio-developer", StringComparison.OrdinalIgnoreCase);
        List<ProjectRow>? items = null;
        if (!string.IsNullOrWhiteSpace(projectsJson))
        {
            try
            {
                items = JsonSerializer.Deserialize<List<ProjectRow>>(projectsJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch
            {
                items = [];
            }
        }

        items ??= [];
        if (items.Count == 0)
            return """<p class="portfolio-empty">Add projects using the + button in the builder.</p>""";

        var sb = new System.Text.StringBuilder();
        foreach (var p in items)
        {
            var title = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(p.Title) ? "Untitled" : p.Title.Trim());
            var desc = WebUtility.HtmlEncode(p.Description?.Trim() ?? "");
            var url = p.ImageUrl?.Trim() ?? "";

            if (isDev)
            {
                if (string.IsNullOrEmpty(url))
                {
                    sb.Append("<div class=\"dev-project-card\"><div class=\"dev-project-img-fallback\"></div><div class=\"box\"><h3>")
                        .Append(title).Append("</h3><p>").Append(desc).Append("</p></div></div>");
                }
                else
                {
                    var u = WebUtility.HtmlEncode(url);
                    sb.Append("<div class=\"dev-project-card\"><img src=\"").Append(u).Append("\" alt=\"").Append(title)
                        .Append("\" loading=\"lazy\" onerror=\"this.style.display='none'\"><div class=\"box\"><h3>")
                        .Append(title).Append("</h3><p>").Append(desc).Append("</p></div></div>");
                }
            }
            else
            {
                if (string.IsNullOrEmpty(url))
                {
                    sb.Append("<div class=\"project-card\"><div class=\"project-img-placeholder\"></div><div class=\"content\"><h3>")
                        .Append(title).Append("</h3><p>").Append(desc).Append("</p></div></div>");
                }
                else
                {
                    var u = WebUtility.HtmlEncode(url);
                    sb.Append("<div class=\"project-card\"><img src=\"").Append(u).Append("\" alt=\"").Append(title)
                        .Append("\" loading=\"lazy\" onerror=\"this.src='https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=220&fit=crop'\"><div class=\"content\"><h3>")
                        .Append(title).Append("</h3><p>").Append(desc).Append("</p></div></div>");
                }
            }
        }

        return sb.ToString();
    }

    private sealed class ProjectRow
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
    }

    [GeneratedRegex(@"\{\{[^}]+\}\}")]
    private static partial Regex PlaceholderRegex();
}
