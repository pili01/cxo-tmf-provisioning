using ConductorSharp.Engine.Builders;
using ConductorSharp.Engine.Builders.Metadata;
using CxoTraining.Application.Models;
using CxoTraining.Application.Workers;
using System;
using System.Collections.Generic;
using System.Text;
using TmfApiClients.ServiceInventoryManagement.v4;

namespace CxoTraining.Application.Workflows;

public class ValidationWorkflowInput : WorkflowInput<ValidationWorkflowOutput>
{
    public required string ServiceId { get; set; }
}

public class ValidationWorkflowOutput : WorkflowOutput
{
    public string? TemplateId { get; set; } = null;
    public string? Email { get; set; } = null;
    public string? CategoryId { get; set; } = null;
    public ServiceOrderData? Characteristics { get; set; }
}

[OriginalName("ValidationWorkflow")]
public class ValidationWorkflow : Workflow<ValidationWorkflow, ValidationWorkflowInput, ValidationWorkflowOutput>
{
    public ValidationWorkflow(WorkflowDefinitionBuilder<ValidationWorkflow, ValidationWorkflowInput, ValidationWorkflowOutput> builder) : base(builder)
    {
    }

    public ValidateCharacteristicsWorker ValidateCharacteristicsWorker { get; set; }

    public override void BuildDefinition()
    {
        base.BuildDefinition();
        _builder.AddTask(
            wf => wf.ValidateCharacteristicsWorker,
            wf => new ValidateCharacteristicsInput { ServiceId = wf.Input.ServiceId });

        _builder.SetOutput(wf => new ValidationWorkflowOutput
        {
            TemplateId = wf.ValidateCharacteristicsWorker.Output.TemplateId,
            Email = wf.ValidateCharacteristicsWorker.Output.Email,
            CategoryId = wf.ValidateCharacteristicsWorker.Output.CategoryId,
            Characteristics = wf.ValidateCharacteristicsWorker.Output.Characteristics
        });
    }
}
