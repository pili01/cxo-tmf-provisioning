using CxoTraining.Application.Models;
using System;
using System.Collections.Generic;
using System.Text;
using MediatR;
using ConductorSharp.Engine;
using ConductorSharp.Engine.Builders.Metadata;
using CxoTraining.Application.Services;

namespace CxoTraining.Application.Workers;

public record CreateHtmlFromCharacteristicsInput() : IRequest<CreateHtmlFromCharacteristicsOutput>
{
    public ServiceOrderData Data {  get; init; }
    public string TemplateId { get; init; }
    public string Email { get; init; }
    public string CategoryId { get; init; }
}

public record CreateHtmlFromCharacteristicsOutput(string Html);

[OriginalName("CreateHtmlFromCharacteristicsWorker")]
public class CreateHtmlFromCharacteristicsWorker(ITemplateService _templateService) : TaskRequestHandler<CreateHtmlFromCharacteristicsInput, CreateHtmlFromCharacteristicsOutput>
{
    public override async Task<CreateHtmlFromCharacteristicsOutput> Handle(CreateHtmlFromCharacteristicsInput request, CancellationToken cancellationToken)
    {
        var html = _templateService.RenderTemplate(request.CategoryId, request.TemplateId, request.Data.ConvertToDictionary());
        if (string.IsNullOrEmpty(html))
            throw new Exception("Unable to render html");
        return new CreateHtmlFromCharacteristicsOutput(html);
    }
}