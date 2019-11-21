/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DATABASE;

module.exports = function (app) { 

  // To fix deprecation warnings from connection to db added {useUnifiedTopology: true }.
  MongoClient.connect(CONNECTION_STRING, {useUnifiedTopology: true }, function(err, client){
    if(err)  throw err;
    console.log('Successful database connection!');
    
    // From Stackflow: The callback now returns the client, which has a function called db(dbname) that you must invoke to get the db. 
    var db = client.db('issuetracker');
    
    app.route('/api/issues/:project*')
    .get(function (req, res){
      var project = req.params.project;
      var params = {};
      if(!project) { 
        res.json({error: "No project specified."}); 
      }else{
        if(req.query._id) { 
          if(ObjectId.isValid(req.body._id)){
            params["_id"] = ObjectId(req.query._id);
          }  
        }
        if(req.query.issue_title) { params["issue_title"] = req.query.issue_title; }
        if(req.query.issue_text) { params["issue_text"] = req.query.issue_text; }
        if(req.query.created_on) { params["created_on"] = req.query.created_on; }
        if(req.query.updated_on) { params["updated_on"] = req.query.updated_on; }
        if(req.query.created_by) { params["created_by"] = req.query.created_by; }
        if(req.query.assigned_to) { params["assigned_to"] = req.query.assigned_to; }
        if(req.query.open) { req.query.open == "true" ? params["open"] = true : params["open"] = false; }
        if(req.query.status_text) { params["status_text"] = req.query.status_text; }
      
        db.collection(project).find(params).toArray(function(err, results) {
          if(err) throw err;
          res.json(results);
        });
      }
    })
    
    .post(function (req, res){
      var project = req.params.project;
      var date = new Date();
      // Make sure valid input is given, i.e. don't accept only white spaces. To improve.
      if(!req.body.issue_title || !req.body.issue_text || !req.body.created_by) {
        res.json({error: "Failed POST. Missing some or all the mandatory fields: Issue Title, Text, Created By."});   
      }else{
        var issue = {issue_title: req.body.issue_title, issue_text: req.body.issue_text, created_by: req.body.created_by, 
                  created_on: date, updated_on: date, open: true, assigned_to: "", status_text: ""}; //project: project, 
        if(req.body.assigned_to) { issue["assigned_to"] = req.body.assigned_to; }
        if(req.body.status_text) { issue["status_text"] = req.body.status_text; }
      
        db.collection(project).insertOne(issue, function(err, doc) {
          if(err) throw err;
          res.json(doc.ops[0]);
        });
      }
    })
    
    .put(function (req, res){
      var project = req.params.project;
      if(!req.body._id){
        res.json({error: "Missing mandatory field _id"});
      }else {
        // Ensure data is passed in the form.
        if( (!req.body.issue_title && !req.body.issue_text && !req.body.created_by && !req.body.assigned_to && !req.body.status_text && !req.body.open) || 
           (req.body.issue_title.length == 0 && req.body.issue_text.length == 0 && req.body.created_by.length == 0 && req.body.assigned_to.length == 0 
            && req.body.status_text.length == 0 && req.body.open==true )) {
            res.json({message: "No updated field sent"});
        }else {
          if(ObjectId.isValid(req.body._id)){
            var date = new Date();
            var updateDetails = {updated_on: date};
            if(req.body.issue_title) { updateDetails["issue_title"] = req.body.issue_title; } 
            if(req.body.issue_text) { updateDetails["issue_text"] = req.body.issue_text; }
            if(req.body.open) { updateDetails["open"] = false; }
            if(req.body.created_by) { updateDetails["created_by"] = req.body.created_by; }
            if(req.body.assigned_to) { updateDetails["assigned_to"] = req.body.assigned_to; }
          
            db.collection(project).updateOne({_id: ObjectId(req.body._id) }, {$set: updateDetails}, function(err, doc) {
              if(err) throw err;
              if(doc.modifiedCount > 0) {
                res.json({message: "Successfully updated " + req.body._id});
              }else{
                res.send("Could not update " + req.body._id); 
              }
          });            
          }else{
            res.json({error: "_id error"});
          }
          
        }
        
      }
    })
    
    .delete(function (req, res){
      var project = req.params.project;
      if(!req.body._id) {
        res.json({error: "_id error"});
      }else{
        if(ObjectId.isValid(req.body._id)){
          db.collection(project).deleteOne({_id: ObjectId(req.body._id) }, function(err, doc) {
            if(err) throw err;
            if(doc.deletedCount > 0) {
              res.json({message: "deleted " + req.body._id});
            }else{
              res.json({message: "Could not delete " + req.body._id}); 
            }
          });
        }else{
          res.json({error: "_id error"});
        }
      }
    });

    // 404 Not Found Middleware. 
    // Moved from server.js to here, otherwise issues running the tests. Info found on FCC forum, but no explanation.
    app.use(function(req, res, next) {
      res.status(404)
      .type('text')
      .send('Not Found');
    });    
    
  });
  
}