var Sequelize = require('sequelize');

var sequelize = new Sequelize('nodeJs', 'root', '1234', {
  host: 'localhost',
  dialect: 'mysql',
});

var Todo = sequelize.define('todo', {
  description: {
    type: Sequelize.STRING,
    allowNull: false,
    validate:{
      len: [1,250]
    },
  },
  completed: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue:false
  }
});

sequelize.sync({
  force: true
}).then(function () {
  // Table created
   Todo.create({
      description: 'Jacob',
      //completed: true
   }).then(function () {
     Todo.create({
       description: 'Sample'
     });
   }).then(function () {
      return Todo.findById(1);
   }).then(function (todo) {
     if (todo) {
       console.log(todo.toJSON());
     } else {
       console.log('No data Found');
     }
   }).catch(function (e) {
    console.log(e);
  })
});
