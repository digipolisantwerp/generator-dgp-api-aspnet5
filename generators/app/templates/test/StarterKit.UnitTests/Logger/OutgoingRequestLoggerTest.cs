using Microsoft.Extensions.Options;
using Serilog;
using Serilog.Sinks.TestCorrelator;
using StarterKit.Framework.Logging;
using StarterKit.Shared.Options.Logging;
using System.Net.Http;
using System.Threading;
using Xunit;

namespace StarterKit.UnitTests.Logger
{
  public class OutgoingRequestLoggerTest
  {
    [Fact]
    public void ShouldLogOutgoingRequest()
    {
      Log.Logger = new LoggerConfiguration()
        .WriteTo
        .TestCorrelator()
        .CreateLogger();

      IOptions<LogSettings> settings =
        Options.Create(new LogSettings
        {
          RequestLogging = new RequestLogging
          {
            IncomingEnabled = true,
            OutgoingEnabled = true
          }
        });

      var handler = new OutgoingRequestLogger<DummyServiceAgent>(settings);
      handler.InnerHandler = new HttpClientHandler();
      var httpRequestMessage = new HttpRequestMessage(HttpMethod.Get, "https://jsonplaceholder.typicode.com/todos/1");
      var invoker = new HttpMessageInvoker(handler);

      using (TestCorrelator.CreateContext())
      {
        var result = invoker.SendAsync(httpRequestMessage, new CancellationToken()).Result;

        Assert.NotNull(result);

        var logs = TestCorrelator.GetLogEventsFromCurrentContext();

        Assert.Single(logs);
        Assert.Contains(logs, l => l.MessageTemplate.Text == "Outgoing API call response");
      }
    }
  }

  public class DummyServiceAgent
  {
    public DummyServiceAgent() { }
  }
}
