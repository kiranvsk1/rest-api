var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;
var todo =[{
  id: 1,
  description:"Nothing",
  completed : false
},
{
  id: 2,
  description:"Nothing To Do",
  completed : false
}];


app.get('/',function (req,res) {
  res.send('This is Todo Api Working');
})

app.get('/todos',function (req,res) {
  res.json(todo);
})
app.get('/todo/:id',function (req,res) {
  var matchedTodo;
  todo.forEach(function (obj) {
    if (obj.id === parseInt(req.params.id,10)) {
      matchedTodo = obj;
    }
  });
  if (matchedTodo) {
    res.json(matchedTodo);
  } else {
    res.status(404).send();
  }
})
app.listen(PORT,function () {
  console.log("express working on "+ PORT + "!");
})
