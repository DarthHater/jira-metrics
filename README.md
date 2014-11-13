# ngs-metrics
### a Sails application
This is a simple, and potentially a bit crappy app that helps get some standard Agile Metrics out of JIRA and displays them using Google Charts and Twitter's Bootstrap. To get this running you'll need to change some settings in config/local.js:
```javascript
  jiraHostname: '', // set this to the host name for jira, aka jira.companyname.com
  jiraPort: 443, // keep this 443 if you use ssl, 80 if otherwise
  jiraUsername: '', // set this to a user who can access JIRA
  jiraPassword: '', // set this to that users password
```
All the usual project setup things you'd want to do include installing sails, and if you set this up on a server, I'd imagine putting it behind NGINX and keeping it up using forever.js or something akin to that. If you want to fix this thing up, feel free to add to it.