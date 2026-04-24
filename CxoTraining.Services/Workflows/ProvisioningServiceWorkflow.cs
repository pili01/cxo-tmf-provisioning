using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;
using ConductorSharp.Client.Generated;
using ConductorSharp.Engine.Builders;
using ConductorSharp.Engine.Builders.Metadata;
using CxoTraining.Application.Models;
using CxoTraining.Application.Workers;
using MediatR;

namespace CxoTraining.Application.Workflows;

public class ProvisioningServiceWorkflowInput : WorkflowInput<ProvisioningServiceWorkflowOutput>
{
    [JsonPropertyName("prepare_output")]
    public required ValidationWorkflowOutput ServiceData { get; set; }
    public required string ServiceId { get; set; }
}

public class ProvisioningServiceWorkflowOutput : WorkflowOutput
{
    public string SavedPath { get; set; }
}

[OriginalName("ProvisioningServiceWorkflow")]
public class ProvisioningServiceWorkflow : Workflow<ProvisioningServiceWorkflow, ProvisioningServiceWorkflowInput, ProvisioningServiceWorkflowOutput>
{
    public ProvisioningServiceWorkflow(WorkflowDefinitionBuilder<ProvisioningServiceWorkflow, ProvisioningServiceWorkflowInput, ProvisioningServiceWorkflowOutput> builder) : base(builder)
    {
    }

    public CreateHtmlFromCharacteristicsWorker CreateHtml { get; set; }
    public StoreHtmlWorker StoreHtml { get; set; }
    public SubmitResourceOrderWorker SubmitResourceOrder { get; set; }

    public override void BuildDefinition()
    {
        base.BuildDefinition();
        _builder.AddTask(
            wf => wf.CreateHtml,
            wf => new CreateHtmlFromCharacteristicsInput { Data = wf.Input.ServiceData.Characteristics, TemplateId = wf.Input.ServiceData.TemplateId, Email = wf.Input.ServiceData.Email, CategoryId = wf.Input.ServiceData.CategoryId });
        _builder.AddTask(
            wf => wf.StoreHtml,
            wf => new StoreHtmlWorkerInput { HtmlContent = wf.CreateHtml.Output.Html });
        _builder.AddTask(
            wf => wf.SubmitResourceOrder,
            wf => new SubmitResourceInput
            {
                FileName = wf.StoreHtml.Output.fileName,
                ServiceId = wf.Input.ServiceId,
            });
        _builder.SetOutput(wf => new ProvisioningServiceWorkflowOutput
        {
            SavedPath = wf.StoreHtml.Output.Path
        });
    }
}
