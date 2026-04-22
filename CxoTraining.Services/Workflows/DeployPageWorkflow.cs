using ConductorSharp.Engine.Builders;
using ConductorSharp.Engine.Builders.Metadata;
using CxoTraining.Application.Workers;
using System;
using System.Collections.Generic;
using System.Text;

namespace CxoTraining.Application.Workflows;

public class DeployPageWorkflowInput : WorkflowInput<DeployPageWorkflowOutput>
{
    public required string ResourceId { get; set; }
}

public class DeployPageWorkflowOutput : WorkflowOutput
{
    public string Url { get; set; }
}

[OriginalName("DeployPageWorkflow")]
public class DeployPageWorkflow : Workflow<DeployPageWorkflow, DeployPageWorkflowInput, DeployPageWorkflowOutput>
{
    public DeployPageWorkflow(WorkflowDefinitionBuilder<DeployPageWorkflow, DeployPageWorkflowInput, DeployPageWorkflowOutput> builder) : base(builder) { }

    public LaunchNginxWorker LaunchNginx { get; set; }
    public SendNotificationEmailWorker SendNotificationEmail { get; set; }

    public override void BuildDefinition()
    {
        base.BuildDefinition();
        _builder.AddTask(
            wf => wf.LaunchNginx,
            wf => new LaunchNginxWorkerInput
            {
                ResourceId = wf.Input.ResourceId,
            });
        _builder.AddTask(
            wf => wf.SendNotificationEmail,
            wf => new SendNotificationEmailWorkerInput
            {
                ToEmail = "exmaple@gmail.com",
                ToName = "Nije ni bitno",
                Body = $"Page deployed successfull​y on URL: {wf.LaunchNginx.Output.Url}",
                Subject = "Page hosting"
            });
        _builder.SetOutput(
            wf => new DeployPageWorkflowOutput
            {
                Url = wf.LaunchNginx.Output.Url,
            });
    }
}
