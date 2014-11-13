var Q = require('q');
var https = require('https');
var http = require('http');
var rally = require('rally');

module.exports.jiraFetch = function(path) {
    var username = sails.config.jiraUsername;
    var password = sails.config.jiraPassword;
    var dfd = new Q.defer();

    var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');

    var options = {
      hostname: sails.config.jiraHostname,
      port: sails.config.jiraPort,
      path: path, //'/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=' + board + '&sprintId=' + sprint,
      method: 'GET', // 'GET',
      secureProtocol: 'SSLv3_method', //'SSLv3_method',
      headers: {
        'Authorization': auth
      }
    };

    options.agent = new https.Agent(options);

    var dataParse = "";
    var req = https.request(options, function(response) {
      response.setEncoding('utf8');
      response.on('data', function (chunk) {
        dataParse += chunk;
      });
      response.on('end', function() {
        var data = JSON.parse(dataParse);
        dfd.resolve(data);
      });
    });

    req.on('error', function(e) {
      console.log('problem with request: ' + e.message);
    });

    // write data to request body
    req.write('data\n');
    req.write('data\n');
    req.end();

    return dfd.promise;
};

module.exports.jiraFetchAsync = function(path, callback) {
    var username = sails.config.jiraUsername;
    var password = sails.config.jiraPassword;

    var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');

    var options = {
      hostname: sails.config.jiraHostname,
      port: sails.config.jiraPort,
      path: path, //'/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=' + board + '&sprintId=' + sprint,
      method: 'GET', // 'GET',
      secureProtocol: 'SSLv3_method', //'SSLv3_method',
      headers: {
        'Authorization': auth
      }
    };

    options.agent = new https.Agent(options);

    var dataParse = "";
    var req = https.request(options, function(response) {
      response.setEncoding('utf8');
      response.on('data', function (chunk) {
        dataParse += chunk;
      });
      response.on('end', function() {
        var data = JSON.parse(dataParse);
        callback.call(null, data);
      });
    });

    req.on('error', function(e) {
      console.log('problem with request: ' + e.message);
    });

    // write data to request body
    req.write('data\n');
    req.write('data\n');
    req.end();
};

module.exports.jiraFetchSprints = function(sprints, board) {
    var sprintReport = [];
    var length = sprints.length;

    for (var i=0; i< length; i++) {
        var def = Q.defer();
        var result = RestService.jiraFetch('/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=' + board + '&sprintId=' + sprints[i].id);
        def.resolve(result);
        sprintReport.push(def.promise);
    }

    return Q.all(sprintReport);
};

module.exports.httpFetch = function(options) {
  var dfd = new Q.defer();

  var reqOptions = {
      hostname: options.hostName,
      port: 80,
      path: options.path,
      method: 'GET'
  };

  var dataParse = "";
  var req = http.request(reqOptions, function(response) {
    response.setEncoding('utf8');
    response.on('data', function (chunk) {
      dataParse += chunk;
    });
    response.on('end', function() {
      if (options.parse === true) {
        var data = JSON.parse(dataParse);
      }
      else {
        var data = dataParse +  ' ' + reqOptions.path;
      }  
      dfd.resolve(data);
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  // write data to request body
  req.write('data\n');
  req.write('data\n');
  req.end();

  return dfd.promise;
}

module.exports.jiraFetchSprintDetails = function(sprintid, boardid, callback) {
    var sprint = sprintid;
    var board = boardid;

    var all = Q.fcall(function() {
      return allData = RestService.jiraFetch('/rest/greenhopper/1.0/xboard/work/allData/?rapidViewId=' + board);
    }).then(function(value) {
      var projectKey = value.orderData.canRankPerProject[0].projectKey;
      var sprintReport = RestService.jiraFetch('/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=' + board + '&sprintId=' + sprint);
      var failedInUat = RestService.jiraFetch('/rest/api/2/search?jql=' + encodeURIComponent('issuetype = Story AND "Testing Failed Count" > 0 AND sprint =' + sprint));
      var newFeature = RestService.jiraFetch('/rest/api/2/search?jql=' + encodeURIComponent('sprint =' + sprint + ' AND issuetype = Story AND "Story Type" = "New Feature"'));
      var newImprovement = RestService.jiraFetch('/rest/api/2/search?jql=' + encodeURIComponent('sprint =' + sprint + ' AND issuetype = Story AND "Story Type" = "Improvement"'));
      var newMaintenance = RestService.jiraFetch('/rest/api/2/search?jql=' + encodeURIComponent('sprint =' + sprint + ' AND issuetype = Story AND "Story Type" = "Maintenance"'));
      var newRefactor = RestService.jiraFetch('/rest/api/2/search?jql=' + encodeURIComponent('sprint =' + sprint + ' AND issuetype = Story AND "Story Type" = "Re-factoring"'));
      var newBugs = RestService.jiraFetch('/rest/api/2/search?jql=' + encodeURIComponent('sprint =' + sprint + ' AND issuetype = Bug'));
      var burndown = RestService.jiraFetch('/rest/greenhopper/1.0/rapid/charts/scopechangeburndownchart?rapidViewId=' + board + '&sprintId=' + sprint);
      var unresolvedBugs = RestService.jiraFetch('/rest/api/2/search?jql=' + encodeURIComponent('project = ' + projectKey + ' AND issuetype = Bug and resolution = Unresolved and status IN (Open, Ready)'));
      var openStories = RestService.jiraFetch('/rest/api/2/search?jql=' + encodeURIComponent('project = ' + projectKey + ' AND issuetype = Story AND status in (Open)'));
      var readyStories = RestService.jiraFetch('/rest/api/2/search?jql=' + encodeURIComponent('project = ' + projectKey + ' AND issuetype = Story AND status in (Ready)'));
      var nonFunctionalStories = RestService.jiraFetch('/rest/api/2/search?jql=' + encodeURIComponent('sprint =' + sprint + ' AND issuetype = "Non Functional Story" '));

      var data = Q.all([
        sprintReport,
        failedInUat,
        newFeature,
        newImprovement,
        newMaintenance,
        newRefactor,
        newBugs,
        burndown,
        unresolvedBugs,
        openStories,
        readyStories,
        nonFunctionalStories
      ]).then(function(value) {
        callback.call(null, value);
      });
    });
};

module.exports.jiraFetchBurndown = function(options, callback) {
    RestService.jiraFetch(options, function(response) {
      var burndownChart = new Object();
      for (var key in response.changes) {
        console.log(key.key);
      }
      callback.call(null, response);
    });
};

module.exports.rallyFetch = function(options, callback) {
    restApi = rally({
        user: sails.config.rallyUsername, //defaults to process.env.RALLY_USERNAME
        pass: sails.config.rallyPassword, //defaults to process.env.RALLY_PASSWORD
        requestOptions: {
            headers: {
                'X-RallyIntegrationName': sails.config.appName,  //while optional, it is good practice to
                'X-RallyIntegrationVendor': sails.config.companyName,             //provide this header information
                'X-RallyIntegrationVersion': sails.config.version                    
            }
            //any additional request options (proxy options, timeouts, etc.)     
        }
    });

    restApi.get({
      ref: '/workspace/14500099699', //may be a ref ('/defect/1234') or an object with a _ref property
      fetch: ['FormattedID', 'Name'], //fields to fetch
          requestOptions: {} //optional additional options to pass through to request
      }).then(function(result) {
          console.log(result.Object);
      }).fail(function(errors) {
         console.log(errors);
    });
};