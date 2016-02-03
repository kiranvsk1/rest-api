var Sequelize = require('sequelize');

var sequelize = new Sequelize('nodeJs', 'root', 'root', {
  host: 'localhost',
  dialect: 'mysql',
});

var db ={};

db.todo = sequelize.import(__dirname+'/models/todo.js');
db.user = sequelize.import(__dirname+'/models/user.js');
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
