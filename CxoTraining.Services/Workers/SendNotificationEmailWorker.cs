using System;
using System.Collections.Generic;
using System.Text;
using CxoTraining.Application.Services;
using MediatR;
using ConductorSharp.Engine;
using ConductorSharp.Engine.Builders.Metadata;

namespace CxoTraining.Application.Workers;

public record SendNotificationEmailWorkerInput : IRequest<SendNotificationEmailWorkerOutput>
{
    public string ToName { get; init; }
    public string ToEmail { get; init; }
    public string Subject { get; init; }
    public string Body { get; init; }
}

public record SendNotificationEmailWorkerOutput;

[OriginalName("SendNotificationEmailWorker")]
public class SendNotificationEmailWorker(ISendMailService sendMailService) : TaskRequestHandler<SendNotificationEmailWorkerInput, SendNotificationEmailWorkerOutput>
{
    public override async Task<SendNotificationEmailWorkerOutput> Handle(SendNotificationEmailWorkerInput request, CancellationToken cancellationToken)
    {
        await sendMailService.SendMail(request.ToName, request.ToEmail, request.Subject, request.Body);
        return new SendNotificationEmailWorkerOutput();
    }
}
