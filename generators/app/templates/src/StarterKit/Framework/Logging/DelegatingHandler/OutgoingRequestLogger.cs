using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;
using Serilog;
using StarterKit.Shared.Options.Logging;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace StarterKit.Framework.Logging.DelegatingHandler
{
	public class OutgoingRequestLogger<T> : System.Net.Http.DelegatingHandler
	{
		private readonly LogSettings _logSettings;
		
		public OutgoingRequestLogger(IOptions<LogSettings> logSettings)
		{
			_logSettings = logSettings.Value ??
			               throw new ArgumentNullException(
				               $"{nameof(OutgoingRequestLogger<T>)}.Ctr parameter {nameof(logSettings)} cannot be null.");
		}

		protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
			CancellationToken cancellationToken)
		{
			if (!_logSettings.RequestLogging.OutgoingEnabled)
			{
				return await base.SendAsync(request, cancellationToken);
			}

			HttpResponseMessage response = null;
			var sw = new Stopwatch();

			try
			{
				sw.Start();

				response = await base.SendAsync(request, cancellationToken);
			}
			finally
			{
				sw.Stop();
				await LogRequest(request, response, sw);
			}

			return response;
		}

		private async Task LogRequest(HttpRequestMessage request, HttpResponseMessage response, Stopwatch sw)
		{
			Log
				.ForContext("Type", new[] { "application" })
				.ForContext("Request", await GetRequestLog(request))
				.ForContext("Response", await GetResponseLog(response, sw.ElapsedMilliseconds))
				.Information($"{nameof(T)} outgoing API call response");
		}

		private static bool ShouldLogHeader(string name, IEnumerable<string> allowedHeaders)
		{
			return allowedHeaders.ToList().Any(x => x.Equals(name, StringComparison.OrdinalIgnoreCase));
		}

		private static Dictionary<string, string> GetHeaders(HttpHeaders headers, IEnumerable<string> allowedHeaders)
		{
			var result = new Dictionary<string, string>();

			if (allowedHeaders == null || allowedHeaders.Count() == 0)
			{
				return result;
			}

			headers
				.Where(x => ShouldLogHeader(x.Key, allowedHeaders))
				.ToList()
				.ForEach(x => result.Add(x.Key, string.Join(",", x.Value)));

			return result;
		}

		private static string GetContentType(HttpHeaders headers)
		{
			headers.TryGetValues(HeaderNames.ContentType, out var contentTypeHeader);

			return contentTypeHeader?.FirstOrDefault();
		}

		private bool ShouldLogRequestPayload()
		{
			return _logSettings.RequestLogging.LogPayload;
		}

		private async Task<string> GetRequestBody(HttpRequestMessage request)
		{
			if (GetContentType(request.Headers)?.Contains("multipart/form-data") == true)
			{
				return "Logging of multipart content body disabled";
			}

			if (request.Content == null)
			{
				return null;
			}

			return await request.Content.ReadAsStringAsync();
		}

		private async Task<Dictionary<string, object>> GetRequestLog(HttpRequestMessage request)
		{
			var requestLog = new Dictionary<string, object>
			{
				{ "method", request.Method },
				{ "host", request.RequestUri.Host },
				{ "path", request.RequestUri.PathAndQuery },
				{ "protocol", request.RequestUri.Scheme },
				{ "headers", GetHeaders(request.Headers, _logSettings.RequestLogging.AllowedOutgoingRequestHeaders) }
			};

			if (ShouldLogRequestPayload())
			{
				requestLog.Add("payload", await GetRequestBody(request));
			}

			return requestLog;
		}

		private bool ShouldLogResponsePayload(HttpResponseMessage response)
		{
			return _logSettings.RequestLogging.LogPayload
			       || (_logSettings.RequestLogging.LogPayloadOnError && (int)response.StatusCode >= 400 &&
			           (int)response.StatusCode < 500);
		}

		private async Task<string> GetResponseBody(HttpResponseMessage response)
		{
			if (GetContentType(response.Headers)?.Contains("multipart/form-data") == true)
			{
				return "Logging of multipart content body disabled";
			}

			try
			{
				if (response.IsSuccessStatusCode)
				{
					return await response.Content?.ReadAsStringAsync();
				}
				else
				{
					// read response buffered to also try to read invalid responses (ex. invalid content-length header, ...)
					return await GetReponseContenBufferedAsync(response);
				}
			}
			catch (Exception ex)
			{
				return $"Unable to read {response.StatusCode}-response body for logging ({ex}).";
			}
		}

		private async Task<string> GetReponseContenBufferedAsync(HttpResponseMessage response)
		{
			using var contentStream = await response.Content.ReadAsStreamAsync();

			var bufferSize = 2048;
			var buffer = new byte[bufferSize];
			var responseContent = new List<byte>();

			try
			{
				var readBytes = 0;
				while ((readBytes = contentStream.Read(buffer)) != 0)
				{
					for (int i = 0; i < readBytes; i++)
					{
						responseContent.Add(buffer[i]);
					}
				}
			}
			catch (IOException ex)
			{
				if (!ex.Message.StartsWith("The response ended prematurely"))
				{
					throw;
				}
			}

			UTF8Encoding encoding = new UTF8Encoding();
			string contentString = encoding.GetString(responseContent.ToArray());

			return contentString;
		}

		private async Task<Dictionary<string, object>> GetResponseLog(HttpResponseMessage response, long durationInMs)
		{
			var responseLog = new Dictionary<string, object> { { "duration", durationInMs } };

			if (response != null)
			{
				responseLog.Add("headers",
					GetHeaders(response.Headers, _logSettings.RequestLogging.AllowedOutgoingResponseHeaders));
				responseLog.Add("status", (int)response.StatusCode);

				if (ShouldLogResponsePayload(response))
				{
					responseLog.Add("payload", await GetResponseBody(response));
				}
			}

			return responseLog;
		}
	}
}
