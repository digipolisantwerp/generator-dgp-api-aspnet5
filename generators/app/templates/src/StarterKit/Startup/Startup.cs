﻿using System.IO;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.PlatformAbstractions;
using StarterKit.Options;
using Toolbox.Correlation;
using Toolbox.WebApi;

namespace StarterKit
{
    public class Startup
    {
		public Startup(IHostingEnvironment env, IApplicationEnvironment appEnv)
		{
            ApplicationBasePath = appEnv.ApplicationBasePath;
            ConfigPath = Path.Combine(ApplicationBasePath, "_config");
            
            var builder = new ConfigurationBuilder()
                .SetBasePath(ConfigPath)
                .AddJsonFile("logging.json")
                .AddJsonFile("app.json")
                .AddEnvironmentVariables();
            
            Configuration = builder.Build();
		}
		
        public IConfigurationRoot Configuration { get; private set; }
        public string ApplicationBasePath { get; private set; }
        public string ConfigPath { get; private set; }
        
        public void ConfigureServices(IServiceCollection services)
        {
            // Check out ExampleController to find out how these configs are injected into other classes
            services.Configure<AppSettings>(Configuration.GetSection("AppSettings"));
            
            services.AddCorrelation();
            
			services.AddMvc()
                .AddActionOverloading()
                .AddVersioning();
            
            services.AddBusinessServices();
            services.AddAutoMapper();
                
            services.AddSwaggerGen();
		}
        
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
		{
            loggerFactory.AddSeriLog(Configuration.GetSection("SeriLog"));
            loggerFactory.AddConsole(Configuration.GetSection("ConsoleLogging"));
            loggerFactory.AddDebug(LogLevel.Debug);
                       
			// CORS
            app.UseCors((policy) => {
                policy.AllowAnyHeader();
                policy.AllowAnyMethod();
                policy.AllowAnyOrigin();
                policy.AllowCredentials();
            });
            
            app.UseExceptionHandling(options => {
                // add your custom exception mappings here
            });

            app.UseCorrelation("StarterKit");

            app.UseIISPlatformHandler();

			app.UseMvc(routes =>
			{
				routes.MapRoute(
					name: "default",
					template: "api/{controller}/{id?}");
			});

            if (env.IsDevelopment())
            {
                app.UseRuntimeInfoPage("/admin/runtimeinfo");
            }
            
            app.UseSwaggerGen();
            app.UseSwaggerUi();
            app.UseSwaggerUiRedirect();
		}
        
        public static void Main(string[] args) => WebApplication.Run<Startup>(args);
    }
}
