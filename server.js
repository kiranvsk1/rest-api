var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var app = express();
var PORT = process.env.PORT || 3000;
var todo =[];
var todoNextId = 1;

app.use(bodyParser.json());
app.get('/',function (req,res) {
  res.send('This is Todo Api Working');
})

app.get('/todos',function (req,res) {
  res.json(todo);
})
app.get('/todo/:id',function (req,res) {
  var matchedTodo;
  matchedTodo = _.findWhere(todo,{id : req.params.id});
  if (matchedTodo) {
    res.json(matchedTodo);
  } else {
    res.status(404).send();
  }
})

///POST
app.post('/todos',function (req, res) {

  var body = _.pick(req.body,'completed','description');
  if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
    return res.status(400).send();
  }
  body.description = body.description.trim();
  body.id = todoNextId++;
  todo.push(body);
  res.json(body);
});

app.listen(PORT,function () {
  console.log("express working on "+ PORT + "!");
})
