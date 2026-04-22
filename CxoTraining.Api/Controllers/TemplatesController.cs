using CxoTraining.Application.Models;
using CxoTraining.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace CxoTraining.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TemplatesController(ITemplateService _templateService) : ControllerBase
{

    [HttpGet("{categoryId}")]
    public ActionResult<List<PageTemplateDto>> GetByCategory(string categoryId)
    {
        var templates = _templateService.GetTemplatesByCategory(categoryId);
        return Ok(templates);
    }

    [HttpGet("{categoryId}/{templateId}")]
    public ActionResult<PageTemplateDto> GetTemplate(string categoryId, string templateId)
    {
        var template = _templateService.GetTemplate(categoryId, templateId);
        if (template == null)
            return NotFound();

        return Ok(template);
    }
}
