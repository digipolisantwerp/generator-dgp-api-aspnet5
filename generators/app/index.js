'use strict';
var Generator = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var del = require('del');
var nd = require('node-dir');
var uuid = require('uuid');
var updateNotifier = require('update-notifier');
var pkg = require('./../../package.json');
// eslint-disable-next-line no-unused-vars
var path = require('path');

module.exports = class extends Generator {

  constructor(args, opts) {
    super(args, opts);
  }

  initializing() {
  }

  prompting() {
    
	//check if no setup is supplied, if so skip the prompt and use options
	if (this.options['skip-prompt'] === 'y') {
		console.log('Skipping prompt because of the no setup parameter')
		//set conflicter force true so that files will be overwritten. If not set to true myacpaas will hang on .gitignore for example
		this.conflicter.force = true;
		return;
	}

    // greet the user
    this.log(yosay('Welcome to the fantastic Yeoman ' + chalk.green('dgp-api-aspnetcore') + ' ' + chalk.blue('(' + pkg.version + ')') + ' generator!'));

    var notifier = updateNotifier({
      pkg,
      updateCheckInterval: 1000 * 60 * 5 // check every 5 minutes.
    });
    notifier.notify();
    if (notifier.update !== undefined) {
      return;
    }

    // ask project parameters
    var prompts = [{
      type: 'input',
      name: 'deleteContent',
      message: 'Delete the contents of this directory before generation (.git will be preserved)? (y/n):',
      default:
				'y'
    }, {
      type: 'input',
      name: 'projectName',
      message: 'Enter the name of the new project (PascalCasing, e.g. "MyProjectApi"):'
    }, {
      type: 'input',
      name: 'kestrelHttpPort',
      message: 'Enter the HTTP port for the kestrel server (use the port assigned by AppConfig + 1):'
    }, {
      type: 'input',
      name: 'iisHttpPort',
      message: 'Enter the HTTP port for the IIS Express server (use the port assigned by AppConfig):'
    }, {
      type: 'input',
      name: 'iisHttpsPort',
      message: 'Enter the HTTPS port for the IIS Express server (last 2 characters of the port assigned by AppConfig with 443 as prefix):'
    }, {
      type: 'input',
      name: 'dataProvider',
      message: 'Which data provider will you be using? MongoDB, MSSQL, PostgreSQL or Not ? (mo/ms/p/n):',
      default:
				'p'
    },
	{
      type: 'input',
      name: 'authConfig',
      message: 'Configure your project with Digipolis Auth Config ? (y/n):',
      default:
				'y'
    }
    ];

    return this.prompt(prompts).then(answers => {
      this.props = answers; // To access answers later use this.props.someOption;
    });
  }

  writing() {
	  
	var done = this.async();	// yeoman async callback
	
    // empty target directory
    console.log('Emptying target directory...');
    if ((this.options['skip-prompt'] === 'y' && this.options['delete-content'] === 'y')
		|| (this.options['skip-prompt'] !== 'y' && this.props.deleteContent === 'y')) {
      del.sync(['**/*', '!.git', '!.git/**/*'], {
        force: true,
        dot: true
      });
    }

    var projectName = this.options['skip-prompt'] === 'y' ? this.options.name : this.props.projectName;
	if (!projectName) {
		projectName = 'Starter app';
	}
    var lowerProjectName = projectName.toLowerCase();

    var solutionItemsGuid = uuid.v1(); console.log('solutionItemsGuid: ' + solutionItemsGuid + '\r\n');
    var srcGuid = uuid.v1();
    var testGuid = uuid.v1();
    var starterKitGuid = uuid.v1();
    var integrationGuid = uuid.v1();
    var unitGuid = uuid.v1();

    var kestrelHttpPort = this.options['skip-prompt'] === 'y' ? this.options['http-kestrel'] : this.props.kestrelHttpPort;
    var iisHttpPort = this.options['skip-prompt'] === 'y' ? this.options['http-iis'] : this.props.iisHttpPort;
    var iisHttpsPort = this.options['skip-prompt'] === 'y' ? this.options['https-iis'] : this.props.iisHttpsPort;
	var optionsDatabase = this.options['database'] ? this.options['database'] : 'p';
    var dataProvider = getDataProvider(this.options['skip-prompt'] === 'y' ? optionsDatabase : this.props.dataProvider, projectName);
	var oauthConfig = getOAuthConfiguration(this.props.authConfig === 'y', projectName);

    var copyOptions = {
      process: function (contents) {
        var str = contents.toString();
        var result = str
          .replace(/StarterKit/g, projectName)
          .replace(/starterkit/g, lowerProjectName)
          .replace(/DataAccessSettingsNpg/g, 'DataAccessSettings')
		  .replace(/DataAccessExtensionsNpg/g, 'DataAccessExtensions')
		  .replace(/\/\/\/\//g, '')
          .replace(/DataAccessSettingsMs/g, 'DataAccessSettings')
		  .replace(/DataAccessExtensionsMs/g, 'DataAccessExtensions')
          .replace(/DataAccessSettingsMongo/g, 'DataAccessSettings')
		  .replace(/DataAccessExtensionsMongo/g, 'DataAccessExtensions')
          .replace(/EntityRepositoryBaseMongo/g, 'EntityRepositoryBase')
          .replace(/GenericEntityRepositoryMongo/g, 'GenericEntityRepository')
          .replace(/IRepositoryMongo/g, 'IRepository')
          .replace(/IRepositoryInjectionMongo/g, 'IRepositoryInjection')
          .replace(/RepositoryBaseMongo/g, 'RepositoryBase')
          .replace(/EntityContextMongo/g, 'EntityContext')
          .replace(/EntityBaseMongo/g, 'EntityBase')
          .replace(/EntityContextMongo/g, 'EntityContext')
          .replace(/ServiceCollectionExtensionsMongo/g, 'ServiceCollectionExtensions')
          .replace(/ControllerTestBaseMongo/g, 'ControllerTestBase')
          .replace(/ControllerTestBaseNoDb/g, 'ControllerTestBase')
          .replace(
            /DataAccessSettingsConfigKeyMs/g,
            'DataAccessSettingsConfigKey'
          )
          .replace(
            /DataAccessSettingsConfigKeyNpg/g,
            'DataAccessSettingsConfigKey'
          )
		  .replace(
            /DataAccessSettingsConfigKeyMongo/g,
            'DataAccessSettingsConfigKey'
          )
          .replace(
            /C3E0690A-0044-402C-90D2-2DC0FF14980F/g,
            solutionItemsGuid.toUpperCase()
          )
          .replace(
            /05A3A5CE-4659-4E00-A4BB-4129AEBEE7D0/g,
            srcGuid.toUpperCase()
          )
          .replace(
            /079636FA-0D93-4251-921A-013355153BF5/g,
            testGuid.toUpperCase()
          )
          .replace(
            /BD79C050-331F-4733-87DE-F650976253B5/g,
            starterKitGuid.toUpperCase()
          )
          .replace(
            /948E75FD-C478-4001-AFBE-4D87181E1BEC/g,
            integrationGuid.toUpperCase()
          )
          .replace(
            /0A3016FD-A06C-4AA1-A843-DEA6A2F01696/g,
            unitGuid.toUpperCase()
          )
          .replace(
            /http:\/\/localhost:51002/g,
            'http://localhost:' + kestrelHttpPort
          )
          .replace(
            /http:\/\/localhost:51001/g,
            'http://localhost:' + iisHttpPort
          )
          .replace(/"sslPort": 44300/g, '"sslPort": ' + iisHttpsPort)
          .replace(/<!-- dataaccess-package -->/g, dataProvider.package)
          .replace(
            /\/\/--dataaccess-startupImports--/g,
            dataProvider.startupImports
          )
		  .replace(
            /\/\/--authorization-startupImports--/g,
            oauthConfig.startupImports
          )
          .replace(
            /\/\/--dataaccess-startupServices--/g,
            dataProvider.startupServices
          )
		  .replace(
            /\/\/--authorization-startupServices--/g,
            oauthConfig.startupServices
          )
          .replace(
            /\/\/--dataaccess-registerConfiguration--/g,
            dataProvider.registerConfiguration
          )
          .replace(/\/\/--dataaccess-variable--/g, dataProvider.variable)
          .replace(/\/\/--dataaccess-config--/g, dataProvider.programConfig)
		  .replace(/\/\/--authorization-config--/g, oauthConfig.programConfig)
          .replace(/<!-- dataaccess-tools -->/g, dataProvider.tools);
		  
		  //now remove db provider specific imports
		  switch (dataProvider.input) {
			case 'p':
				result = result
					.replace(/<!--StartMongoSpecificPackage(.*)EndMongoSpecificPackage-->/s, '')
					.replace(/<!--StartMsSpecificPackage(.*)EndMsSpecificPackage-->/s, '')
					.replace(/<!--StartEfSpecificPackage-->/g, '')
					.replace(/<!--EndEfSpecificPackage-->/g, '')
					.replace(/<!--StartPostgreSpecificPackage-->/g, '')
					.replace(/<!--StartEfTestSpecificPackage-->/g, '')
					.replace(/<!--EndEfTestSpecificPackage-->/g, '')
					.replace(/<!--EndPostgreSpecificPackage-->/g, '');
				break;
			case 'ms':
				result = result
					.replace(/<!--StartMongoSpecificPackage(.*)EndMongoSpecificPackage-->/s, '')
					.replace(/<!--StartPostgreSpecificPackage(.*)EndPostgreSpecificPackage-->/s, '')
					.replace(/<!--StartEfSpecificPackage-->/g, '')
					.replace(/<!--EndEfSpecificPackage-->/g, '')
					.replace(/<!--StartMsSpecificPackage-->/g, '')
					.replace(/<!--StartEfTestSpecificPackage-->/g, '')
					.replace(/<!--EndEfTestSpecificPackage-->/g, '')
					.replace(/<!--EndMsSpecificPackage-->/g, '');
				break;
			  break;
			case 'mo':
				result = result
					.replace(/<!--StartEfSpecificPackage(.*)EndEfSpecificPackage-->/s, '')
					.replace(/<!--StartMsSpecificPackage(.*)EndMsSpecificPackage-->/s, '')
					.replace(/<!--StartPostgreSpecificPackage(.*)EndPostgreSpecificPackage-->/s, '')
					.replace(/<!--StartEfTestSpecificPackage(.*)EndEfTestSpecificPackage-->/s, '')
					.replace(/<!--StartMongoSpecificPackage-->/g, '')
					.replace(/<!--EndMsSpecificPackage-->/g, '');
				break;
			  break;
			default:
				result = result
					.replace(/<!--StartMongoSpecificPackage(.*)EndMongoSpecificPackage-->/s, '')
					.replace(/<!--StartEfSpecificPackage(.*)EndEfSpecificPackage-->/s, '')
					.replace(/<!--StartMsSpecificPackage(.*)EndMsSpecificPackage-->/s, '')
					.replace(/<!--StartEfTestSpecificPackage(.*)EndEfTestSpecificPackage-->/s, '')
					.replace(/<!--StartPostgreSpecificPackage(.*)EndPostgreSpecificPackage-->/s, '');
		  }
		  

		  
        return result;
      }
    };

    var source = this.sourceRoot();
    var dest = this.destinationRoot();
    var fs = this.fs;

    // copy files and rename starterkit to projectName
    console.log('Creating project skeleton. All files are generated in memory before any of them is committed to the destination directory. This can take a while...');
	
	var ignoreFiles = [];
	//if no database then also remove all files inside dataprovider folders
	if(dataProvider.input === 'n') {
		nd.files(source+'/src/StarterKit/DataAccess', function (err, files) {
			for (var i = 0; i < files.length; i++) {
				ignoreFiles.push(files[i]);
				console.log('ignor file ' + files[i] );
			}
		});
		
		nd.files(source+'/src/StarterKit/Entities', function (err, files) {
			for (var i = 0; i < files.length; i++) {
				ignoreFiles.push(files[i]);
				console.log('ignor file ' + files[i] );
			}
		});
		
		nd.files(source+'/test/StarterKit.UnitTests/DataAccess', function (err, files) {
			for (var i = 0; i < files.length; i++) {
				ignoreFiles.push(files[i]);
				console.log('ignor file ' + files[i] );
			}
		});
	}
	
	if(dataProvider.input === 'n' || dataProvider.input === 'mo') {
		nd.files(source+'/test/StarterKit.UnitTests/Migrations', function (err, files) {
			for (var i = 0; i < files.length; i++) {
				ignoreFiles.push(files[i]);
				console.log('ignor file ' + files[i] );
			}
		});
	}

    nd.files(source, function (err, files) {
		
		
      for (var i = 0; i < files.length; i++) {
        
        var filename = files[i]
          .replace(/StarterKit/g, projectName)
          .replace(/starterkit/g, lowerProjectName)
          .replace('.npmignore', '.gitignore')
          .replace('dataaccess.ms.json', 'dataaccess.json')
          .replace('dataaccess.npg.json', 'dataaccess.json')
		  .replace('dataaccess.mongo.json', 'dataaccess.json')
          .replace('DataAccessSettings.ms.cs', 'DataAccessSettings.cs')
          .replace('DataAccessSettings.npg.cs', 'DataAccessSettings.cs')
		  .replace('DataAccessSettings.mongo.cs', 'DataAccessSettings.cs')
          .replace('DataAccessSettingsConfigKey.ms.cs', 'DataAccessSettingsConfigKey.cs')
          .replace('DataAccessSettingsConfigKey.npg.cs', 'DataAccessSettingsConfigKey.cs')
          .replace('DataAccessSettingsConfigKey.mongo.cs', 'DataAccessSettingsConfigKey.cs')
		  .replace('EntityRepositoryBase.mongo.cs', 'EntityRepositoryBase.cs')
		  .replace('GenericEntityRepository.mongo.cs', 'GenericEntityRepository.cs')
		  .replace('IRepository.mongo.cs', 'IRepository.cs')
		  .replace('IRepositoryInjection.mongo.cs', 'IRepositoryInjection.cs')
		  .replace('RepositoryBase.mongo.cs', 'RepositoryBase.cs')
		  .replace('EntityBase.mongo.cs', 'EntityBase.cs')
		  .replace('ContextBase.mongo.cs', 'ContextBase.cs')
		  .replace('EntityContext.mongo.cs', 'EntityContext.cs')
		  .replace('ServiceCollectionExtensions.mongo.cs', 'ServiceCollectionExtensions.cs')
		  .replace('ControllerTestBase.mongo.cs', 'ControllerTestBase.cs')
		  .replace('ControllerTestBase.nodb.cs', 'ControllerTestBase.cs')
          .replace(source, dest);
        switch (dataProvider.input) {
        case 'p':
		  if (
            files[i].indexOf('dataaccess.ms.json') > -1 ||
            files[i].indexOf('DataAccessSettings.ms.cs') > -1 ||
            files[i].indexOf('DataAccessSettingsConfigKey.ms.cs') > -1 ||
			files[i].indexOf('dataaccess.mongo.json') > -1 ||
            files[i].indexOf('DataAccessSettings.mongo.cs') > -1 ||
            files[i].indexOf('DataAccessSettingsConfigKey.mongo.cs') > -1 ||
            files[i].indexOf('EntityRepositoryBase.mongo.cs') > -1 ||
			files[i].indexOf('GenericEntityRepository.mongo.cs') > -1 ||
			files[i].indexOf('IRepository.mongo.cs') > -1 ||
            files[i].indexOf('IRepositoryInjection.mongo.cs') > -1 ||
            files[i].indexOf('RepositoryBase.mongo.cs') > -1 ||
            files[i].indexOf('EntityBase.mongo.cs') > -1 ||
            files[i].indexOf('ContextBase.mongo.cs') > -1 ||            
            files[i].indexOf('EntityContext.mongo.cs') > -1 ||         
            files[i].indexOf('ControllerTestBase.mongo.cs') > -1 ||         
            files[i].indexOf('ControllerTestBase.nodb.cs') > -1 ||         
            files[i].indexOf('ServiceCollectionExtensions.mongo.cs') > -1 ||
			files[i].indexOf('FooMongoRepository.cs') > -1 ||
			files[i].indexOf('MongoContext.cs') > -1 ||
			files[i].indexOf('FooMongo.cs') > -1 ||
			files[i].indexOf('GenericEntityMongoRepositoryTests.cs') > -1 ||
			files[i].indexOf('AddDataAccessOptionsMongoTests.cs') > -1
          ) {
            ignoreFiles.push(files[i]);
          }
		  
          break;
        case 'ms':
		  if (
            files[i].indexOf('dataaccess.npg.json') > -1 ||
            files[i].indexOf('DataAccessSettings.npg.cs') > -1 ||
            files[i].indexOf('DataAccessSettingsConfigKey.npg.cs') > -1 ||
			files[i].indexOf('dataaccess.mongo.json') > -1 ||
            files[i].indexOf('DataAccessSettings.mongo.cs') > -1 ||
            files[i].indexOf('DataAccessSettingsConfigKey.mongo.cs') > -1 ||
            files[i].indexOf('EntityRepositoryBase.mongo.cs') > -1 ||
			files[i].indexOf('GenericEntityRepository.mongo.cs') > -1 ||
			files[i].indexOf('IRepository.mongo.cs') > -1 ||
            files[i].indexOf('IRepositoryInjection.mongo.cs') > -1 ||
            files[i].indexOf('RepositoryBase.mongo.cs') > -1 ||
            files[i].indexOf('EntityBase.mongo.cs') > -1 ||
            files[i].indexOf('ContextBase.mongo.cs') > -1 ||            
            files[i].indexOf('EntityContext.mongo.cs') > -1 ||      
			files[i].indexOf('ControllerTestBase.mongo.cs') > -1 || 
			files[i].indexOf('ControllerTestBase.nodb.cs') > -1 ||    			
            files[i].indexOf('ServiceCollectionExtensions.mongo.cs') > -1 ||
			files[i].indexOf('FooMongoRepository.cs') > -1 ||
			files[i].indexOf('MongoContext.cs') > -1 ||
			files[i].indexOf('FooMongo.cs') > -1 ||
			files[i].indexOf('DbScriptRunner.cs') > -1 ||
			files[i].indexOf('GenericEntityMongoRepositoryTests.cs') > -1 ||
			files[i].indexOf('AddDataAccessOptionsMongoTests.cs') > -1
          ) {
            ignoreFiles.push(files[i]);
          }

          break;
		case 'mo':
		  if (
            files[i].indexOf('dataaccess.npg.json') > -1 ||
            files[i].indexOf('DataAccessSettings.npg.cs') > -1 ||
            files[i].indexOf('DataAccessSettingsConfigKey.npg.cs') > -1 ||
			files[i].indexOf('dataaccess.ms.json') > -1 ||
            files[i].indexOf('DataAccessSettings.ms.cs') > -1 ||
            files[i].indexOf('DataAccessSettingsConfigKey.ms.cs') > -1 ||
			files[i].indexOf('EntityRepositoryBase.cs') > -1 ||
			files[i].indexOf('GenericEntityRepository.cs') > -1 ||
			files[i].indexOf('IRepository.cs') > -1 ||
            files[i].indexOf('IRepositoryInjection.cs') > -1 ||
            files[i].indexOf('RepositoryBase.cs') > -1 ||
			(files[i].indexOf('EntityBase.cs') > -1 && files[i].indexOf('IEntityBase.cs') < 0) ||
            files[i].indexOf('ContextBase.cs') > -1 ||            
            files[i].indexOf('EntityContext.cs') > -1 ||         
            files[i].indexOf('ServiceCollectionExtensions.cs') > -1 ||
			files[i].indexOf('ControllerTestBase.cs') > -1 || 
			files[i].indexOf('ControllerTestBase.nodb.cs') > -1 ||   
            files[i].indexOf('ModelBuilderExtensions.cs') > -1 ||
            files[i].indexOf('Foo.cs') > -1 ||
            files[i].indexOf('FooGuid.cs') > -1 ||
            files[i].indexOf('FooGuidRepository.cs') > -1 ||
            (files[i].indexOf('FooRepository.cs') > -1 && files[i].indexOf('IFooRepository.cs') < 0) ||
            files[i].indexOf('FooSqlLiteRepository.cs') > -1 ||
            files[i].indexOf('InMemoryContext.cs') > -1 ||
            files[i].indexOf('TestContext.cs') > -1 ||
            files[i].indexOf('SqlLiteContext.cs') > -1 ||
            files[i].indexOf('EfTransactionTests.cs') > -1 ||
			files[i].indexOf('DbScriptRunner.cs') > -1 ||
            files[i].indexOf('GenericEntityRepositoryTests.cs') > -1 || 
            files[i].indexOf('GenericGuidEntityRepositoryTests.cs') > -1 || 
            files[i].indexOf('AddDataAccessOptionsTests.cs') > -1     
          ) {
            ignoreFiles.push(files[i]);
          }

          break;
        default:
          if (
            files[i].indexOf('EntityContext.cs') > -1 ||
            files[i].indexOf('DataAccessDefaults.cs') > -1 ||
            files[i].indexOf('dataaccess.ms.json') > -1 ||
            files[i].indexOf('dataaccess.npg.json') > -1 ||
            files[i].indexOf('DataAccessSettings.ms.cs') > -1 ||
            files[i].indexOf('DataAccessSettings.npg.cs') > -1 ||
            files[i].indexOf('DataAccessSettingsConfigKey.ms.cs') > -1 ||
            files[i].indexOf('DataAccessSettingsConfigKey.npg.cs') > -1 ||
			files[i].indexOf('dataaccess.mongo.json') > -1 ||
            files[i].indexOf('EntityRepositoryBase.mongo.cs') > -1 ||
			files[i].indexOf('GenericEntityRepository.mongo.cs') > -1 ||
			files[i].indexOf('IRepository.mongo.cs') > -1 ||
            files[i].indexOf('IRepositoryInjection.mongo.cs') > -1 ||
            files[i].indexOf('RepositoryBase.mongo.cs') > -1 ||
            files[i].indexOf('EntityBase.mongo.cs') > -1 ||
			files[i].indexOf('ServiceCollectionExtensions.mongo.cs') > -1 ||
            files[i].indexOf('ServiceCollectionExtensions.cs') > -1 ||
			files[i].indexOf('ControllerTestBase.cs') > -1 || 
			files[i].indexOf('ControllerTestBase.mongo.cs') > -1 ||   
            files[i].indexOf('ContextBase.mongo.cs') > -1   
          ) {
            ignoreFiles.push(files[i]);
          }

        }

        if (!ignoreFiles.includes(files[i])) {
          fs.copy(files[i], filename, copyOptions);
        }
      }
	  
	  done();
    });

  }

  install() {
    // this.installDependencies();
    //this.log('----');
  }
};

function getDataProvider(input, projectName) {
	
	// packages
	var efCorePackage =
		'<PackageReference Include="Microsoft.EntityFrameworkCore" Version="5.0.12" />\n';
	var tools =
		'<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="5.0.12">\n' +
		'<PrivateAssets>all</PrivateAssets>\n' +
		'<IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>\n' +
		'</PackageReference>\n';
	var npgSqlPackage =
		'<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="5.0.10" />\n' + 
		'<PackageReference Include="dbup-core" Version="4.6.3" />\n' + 
		'<PackageReference Include="dbup-postgresql" Version="4.6.3" />\n';
	var sqlServerPackage =
		'<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="5.0.12" />\n';
	var mongoPackages =
		'<PackageReference Include="MongoDB.Bson" Version="2.13.2" />\n' +
		'<PackageReference Include="MongoDB.Driver" Version="2.13.2" />\n';
	
	// code - usings
	var usings = 'using Microsoft.EntityFrameworkCore;\nusing Microsoft.EntityFrameworkCore.Migrations;\nusing StarterKit.DataAccess;\nusing StarterKit.DataAccess.Options;\nusing Microsoft.EntityFrameworkCore.Diagnostics;\nusing StarterKit.DataAccess.Context;'.replace(/StarterKit/g, projectName);
	var mongoUsings = 'using StarterKit.DataAccess;\nusing StarterKit.DataAccess.Options;\nusing StarterKit.DataAccess.Context;'.replace(/StarterKit/g, projectName);
  
	// code - various
	var programConfig = 'config.AddDataAccessConfiguration(env);';
	var registerConfiguration = 'DataAccessSettings.RegisterConfiguration(services, Configuration);';
	var variable = 'var dataAccessSettings = DataAccessSettings.GetConfigurationSection(Configuration).Get<DataAccessSettings>();';
	

  var dataProvider = {
    input: input,
    package: '',
    startupServices: '',
    startupImports: '',
    programConfig: '',
    connString: '',
    tools: '',
    registerConfiguration: '',
    variable: ''
  };

  if (input.toLowerCase() === 'p') {
    dataProvider.package = efCorePackage + npgSqlPackage;
    dataProvider.startupServices =
			'      services.AddDataAccess<EntityContext>()\n' +
			'      .AddDbContext<EntityContext>(options => {\n' +
			'      		options.UseNpgsql(dataAccessSettings.GetConnectionString(),\n' +
			'      		opt => opt.MigrationsHistoryTable(HistoryRepository.DefaultTableName, DataAccessDefaults.SchemaName));\n' +
			'      });\n' + 
			'      \n' +
			'      DbScriptRunner.UpdateDatabase(dataAccessSettings);';

    dataProvider.startupImports = usings;
    dataProvider.programConfig = programConfig;
    dataProvider.tools = tools;
    dataProvider.registerConfiguration = registerConfiguration;
    dataProvider.variable = variable;
  } else if (input.toLowerCase() === 'ms') {
    dataProvider.package = efCorePackage + sqlServerPackage;
    dataProvider.startupServices =
		'      services.AddDataAccess<EntityContext>()\n' +
		'      .AddDbContext<EntityContext>(options => {\n' +
		'      		options.UseSqlServer(dataAccessSettings.GetConnectionString());\n' +
		'      });';

    dataProvider.startupImports = usings;
    dataProvider.programConfig = programConfig;
    dataProvider.tools = tools;
    dataProvider.registerConfiguration = registerConfiguration;
    dataProvider.variable = variable;
  } else if (input.toLowerCase() === 'mo') {
    dataProvider.package = mongoPackages;
    dataProvider.startupServices =
		'      services.AddDataAccess<EntityContext>();';

    dataProvider.startupImports = mongoUsings;
    dataProvider.programConfig = programConfig;
    dataProvider.registerConfiguration = registerConfiguration;
    dataProvider.variable = variable;
  }

  return dataProvider;
}


function getOAuthConfiguration(useAuthConfig, projectName) {
	var oauthConfig = {
		package: '',
		startupServices: addConfig,
		startupImports: usings,
		programConfig: programConfig
	};
	if(useAuthConfig) {
		// code - usings
		var usings = 'using Digipolis.Auth;';
	  
		// code - various
		var programConfig = 'config.AddJsonFile(JsonFilesKey.AuthJson);';
		
		var addConfig =
			'services.AddAuthorization(services.BuildJwtAuthPolicies());\n' +
			'services.AddAuthFromOptions(options => \n' +
			'{ \n'+
			'  var configSection = Configuration.GetSection(Shared.Constants.ConfigurationSectionKey.Auth);\n' +
			'  configSection.Bind(options);\n' +
			'  AuthSettingsConfig.SetConfig(options, Environment);\n' +
			'},\n' +
			'devOptions => \n' +
			'{\n' +
			'  var configSection = Configuration.GetSection(Shared.Constants.ConfigurationSectionKey.DevPermissions);\n' + 
			'  configSection.Bind(devOptions);\n' +
			'});\n';
	  

     	  oauthConfig.startupServices = addConfig;
		  oauthConfig.startupImports = usings;
		  oauthConfig.programConfig = programConfig;		  
	}
  

  return oauthConfig;
}
