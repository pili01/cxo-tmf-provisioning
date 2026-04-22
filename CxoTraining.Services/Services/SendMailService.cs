using MailKit.Net.Smtp;
using Microsoft.Extensions.Configuration;
using MimeKit;
using System;
using System.Collections.Generic;
using System.Text;

namespace CxoTraining.Application.Services;

public interface ISendMailService
{
    Task SendMail(string toName, string to, string subject, string body);
}

public class SendMailService(IConfiguration _configuration) : ISendMailService
{
    public Task SendMail(string toName, string to, string subject, string body)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Portfolio App", "portfolio@example.com"));
        message.To.Add(new MailboxAddress(toName, to));
        message.Subject = subject;

        message.Body = new TextPart("plain")
        {
            Text = body
        };

        using (var client = new SmtpClient())
        {
            // Spajanje na server (npr. Gmail, Outlook ili Mailtrap za testiranje)
            client.ServerCertificateValidationCallback = (s, c, h, e) => true;
            client.CheckCertificateRevocation = false;
            client.Connect(_configuration["MailConfiguration:Host"], int.Parse(_configuration["MailConfiguration:Port"]), MailKit.Security.SecureSocketOptions.StartTls);

            // Autentifikacija
            client.Authenticate(_configuration["MailConfiguration:SenderEmail"], _configuration["MailConfiguration:Password"]);

            client.Send(message);
            client.Disconnect(true);
        }
        Console.WriteLine($"Sending mail to: {to}, Subject: {subject}, Body: {body}");
        return Task.CompletedTask;
    }
}
