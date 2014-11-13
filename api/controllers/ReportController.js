/**
 * ReportController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var Q = require('q');

module.exports = {
    
  /**
   * Action blueprintrints:
   *    `/report/sprint`
   */
   sprint: function (req, res) {
    var sprint = req.param('sprintid');
    var board = req.param('boardid');

    var allData = RestService.jiraFetchSprintDetails(sprint, board, function(data) {
      return res.view('report/sprint', { sprint: data[0],
          failedInUat: data[1],
          newFeature: data[2],
          newImprovement: data[3],
          newMaintenance: data[4],
          newRefactor: data[5],
          newBugs: data[6],
          burndown: data[7],
          board: board,
          unresolvedBugs: data[8].total,
          openStories: data[9].total,
          readyStories: data[10].total,
          nonFunctionalStories: data[11].total});
    });
  },

  /**
   * Action blueprints:
   *    `/report/board`
   */
   board: function (req, res) {
    var id = req.param('boardid');
    var all;
    var projectKey;
    var sprints;
    var unresolvedBugs;
    var openStories;
    var readyStories;
    var sprintReport = [];
      
    Q.fcall(function() {
      return allData = RestService.jiraFetch('/rest/greenhopper/1.0/xboard/work/allData/?rapidViewId=' + id); })
    .then(function(value) {
      projectKey = value.orderData.canRankPerProject[0].projectKey;
      sprints = RestService.jiraFetch('/rest/greenhopper/1.0/sprintquery/' + id + '?includeHistoricSprints=false');
      unresolvedBugs = RestService.jiraFetch('/rest/api/2/search?jql=' + encodeURIComponent('project = ' + projectKey + ' AND issuetype = Bug and resolution = Unresolved and status IN (Open, Ready)'));
      openStories = RestService.jiraFetch('/rest/api/2/search?jql=' + encodeURIComponent('project = ' + projectKey + ' AND issuetype = Story AND status in (Open)'));
      readyStories = RestService.jiraFetch('/rest/api/2/search?jql=' + encodeURIComponent('project = ' + projectKey + ' AND issuetype = Story AND status in (Ready)'));
      all = value;

      var data = Q.all([
        sprints,
        unresolvedBugs,
        openStories,
        readyStories
        ])
      .then(function(value) {
          sprints = value[0];
          unresolvedBugs = value[1].total;
          openStories = value[2].total;
          readyStories = value[3].total;
          sprints.sprints.forEach(function(sprint) {
            sprintReport.push(RestService.jiraFetch('/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=' + id + '&sprintId=' + sprint.id));
          });
          Q.all(sprintReport)
          .then(function(value) {
            var avgTotal = 0;
            var avg = 0;
            value.forEach(function(sprint) {
              avgTotal += sprint.contents.completedIssuesEstimateSum.value;
            });
            avg = avgTotal / sprintReport.length;
            return res.view('report/board', {
              sprints: sprints, 
              unresolvedBugs: unresolvedBugs, 
              openStories: openStories,
              readyStories: readyStories,
              allData: all,
              projectKey: projectKey,
              boardid: id,
              sprintReport: value,
              averageVelocity: avg});
          });
        }); 
      });
  },


  /**
   * Action blueprints:
   *    `/report/index`
   *    `/report`
   */
   index: function (req, res) {
      // var options = new Object();
      // options.path = '/slm/webservice/v3.0/security/authorize'; //'/rest/greenhopper/1.0/sprintquery/' + id + '?includeHistoricSprints=false';
      // options.httpmethod = 'GET';
      // options.secureprotocol = 'SSLv3_method';
      // var data = RestService.rallyFetch(options, function(data) {
      //   console.log(data);
      //           return res.view('report/board', {sprints: data, boardid: id});
      // });
    var data;

    Q.fcall(function() {
      return data = RestService.jiraFetch('/rest/greenhopper/1.0/rapidviews/list');
    }).then(function(value) {
      return res.view('report/project', { boards: value });
    });
  },

    workspace: function (req, res) {
      var options = new Object();
      options.path = '/slm/webservice/v3.0/security/authorize'; //'/rest/greenhopper/1.0/sprintquery/' + id + '?includeHistoricSprints=false';
      options.httpmethod = 'GET';
      options.secureprotocol = 'SSLv3_method';
      var data = RestService.rallyFetch(options, function(data) {
        return res.view('report/board', {sprints: data, boardid: id});
      });
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to ReportController)
   */
  _config: {}

  
};
