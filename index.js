// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var ParseDashboard = require('parse-dashboard');
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  push: {
    android: {
      senderId: process.env.ANDROID_SENDER_ID || '', // The Sender ID of GCM
      apiKey: process.env.ANDROID_API_KEY || '' // The Server API Key of GCM
    }
  },
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

// For parse-dashboard
var mountPath = process.env.PARSE_MOUNT || '/parse';
var serverUrl = process.env.SERVER_URL || 'http://localhost:1337/parse';
var serverMountPath = serverUrl + mountPath;
const allowInsecureHTTP = process.env.PARSE_DASHBOARD_ALLOW_INSECURE_HTTP || 0;

var dashboard = new ParseDashboard({
  apps: [
    {
      serverURL: serverMountPath,
      appId: process.env.APP_ID || 'myAppId',
      masterKey: process.env.MASTER_KEY || '',
      appName: process.env.PARSE_DASHBOARD_APP_NAME || 'MyApp'
    }
  ],
  users: [
    {
      user: process.env.PARSE_DASHBOARD_USER_ID,
      pass: process.env.PARSE_DASHBOARD_USER_PASSWORD
    }
  ]
}, allowInsecureHTTP);

var app = express();

if (allowInsecureHTTP)
    app.enable('trust proxy');

app.use('/dashboard', dashboard);

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
