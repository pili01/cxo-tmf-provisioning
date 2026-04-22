using CxoTraining.Application.Models;
using CxoTraining.Application.Services;
using CxoTraining.Application.Workers;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CxoTraining.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PagesController(ITemplateService _templateService, IWebHostEnvironment _env, IMediator _mediator) : ControllerBase
{

    [HttpPost("deploy")]
    public async Task<ActionResult<DeployResponse>> Deploy([FromBody] DeployRequest request)
    {
        try
        {
            var response = await _mediator.Send(new SubmitOrderInput { DeployRequest = request });
            return Ok(new DeployResponse
            {
                Success = true,
                Message = "Deployment successful! You will get email with page url"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new DeployResponse
            {
                Success = false,
                Message = $"Deployment failed: {ex.Message}"
            });
        }
        //var template = _templateService.GetTemplate(request.CategoryId, request.TemplateId);
        //if (template is null)
        //{
        //    return BadRequest(new DeployResponse
        //    {
        //        Success = false,
        //        Message = "Template not found."
        //    });
        //}

        //var renderedHtml = _templateService.RenderTemplate(
        //    request.CategoryId,
        //    request.TemplateId,
        //    request.Fields
        //);

        //var outputDir = Path.Combine(_env.ContentRootPath, "DeployedPages");
        //Directory.CreateDirectory(outputDir);

        //var uniqueId = Guid.NewGuid().ToString("N")[..8];
        //var fileName = $"{request.CategoryId}-{request.TemplateId}-{uniqueId}.html";
        //var filePath = Path.Combine(outputDir, fileName);
        //System.IO.File.WriteAllText(filePath, renderedHtml);

        //return Ok(new DeployResponse
        //{
        //    Success = true,
        //    Url = $"/deployed/{fileName}",
        //    Message = "Page deployed successfully!"
        //});
    }
}
