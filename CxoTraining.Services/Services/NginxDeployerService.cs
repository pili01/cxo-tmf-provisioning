using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Sockets;
using System.Text;

namespace CxoTraining.Application.Services;

public interface INginxDeployer
{
    Task<string> DeployHtmlSite(string fileName);
}

public class NginxDeployer : INginxDeployer
{
    private readonly DockerClient _client;
    private readonly IHostEnvironment _env;

    public NginxDeployer(IHostEnvironment env)
    {
        bool isDocker = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";

        var dockerUri = isDocker
            ? new Uri("unix:///var/run/docker.sock") // Putanja unutar kontejnera
            : new Uri("npipe://./pipe/docker_engine"); // Lokalno na Windowsima

        var config = new DockerClientConfiguration(dockerUri);
        _client = config.CreateClient();

        _env = env;
    }

    public async Task<string> DeployHtmlSite(string fileName)
    {
        int randomPort = GetFreeTcpPort();
        string containerName = $"nginx-dynamic-{Guid.NewGuid().ToString()[..8]}";
        var outputDir = Path.Combine(_env.ContentRootPath, "DeployedPages/", fileName);
        string hostPath = "C:/CxoTemp/DeployedPages";

        // 1. Povuci Nginx sliku ako ne postoji
        await _client.Images.CreateImageAsync(
            new ImagesCreateParameters { FromImage = "nginx", Tag = "latest" },
            null, new Progress<JSONMessage>());

        // 2. Konfiguracija kontejnera
        var config = new CreateContainerParameters
        {
            Image = "nginx:latest",
            Name = containerName,
            ExposedPorts = new Dictionary<string, EmptyStruct>
            {
                { "80", default }
            },
            HostConfig = new HostConfig
            {
                PortBindings = new Dictionary<string, IList<PortBinding>>
                {
                    { "80", new List<PortBinding> { new PortBinding { HostPort = randomPort.ToString() } } }
                },
                Binds = new List<string> { $"{hostPath}:/usr/share/nginx/html:ro" }
            }
        };

        // 3. Kreiraj i pokreni
        var response = await _client.Containers.CreateContainerAsync(config);
        await _client.Containers.StartContainerAsync(response.ID, null);

        return $"http://localhost:{randomPort}/{fileName}";
    }

    private int GetFreeTcpPort()
    {
        TcpListener l = new TcpListener(IPAddress.Loopback, 0);
        l.Start();
        int port = ((IPEndPoint)l.LocalEndpoint).Port;
        l.Stop();
        return port;
    }
}
