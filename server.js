var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcrypt');
var middleware = require('./middleware.js')(db);

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function (req, res) {
	res.send('Todo API Root');
});

// GET /todos?completed=false&q=work
app.get('/todos', middleware.requireAuthentication, function (req, res) {
	var queryParams = req.query;
	var where = {};

	if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'true') {
		where.completed = true;
	} else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false') {
		where.completed = false;
	}

	if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
		where.description = {
			$like : '%'+queryParams.q+'%'
		};
	}

	db.todo.findAll({where: where}).then(function (todos) {
		res.json(todos);
	},function (e) {
		res.send(500).send();
	})

	// var filteredTodos = todos;
	//
	// if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'true') {
	// 	filteredTodos = _.where(filteredTodos, {completed: true});
	// } else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false') {
	// 	filteredTodos = _.where(filteredTodos, {completed: false});
	// }
	//
	// if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
	// 	filteredTodos = _.filter(filteredTodos, function (todo) {
	// 		return todo.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1;
	// 	});
	// }

	// res.json(filteredTodos);
});

// GET /todos/:id
app.get('/todos/:id', middleware.requireAuthentication, function (req, res) {
	var todoId = parseInt(req.params.id, 10);
	db.todo.findById(todoId).then(function (todo) {
		if (!!todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).send();
		}
	},function () {
		res.status(500).send();
	})
});

// POST /todos
app.post('/todos',middleware.requireAuthentication, function (req, res) {
	var body = _.pick(req.body, 'description', 'completed');
	db.todo.create(body).then(function (todo) {
		res.json(todo);
	},function (e) {
		res.status(400).json(e);
	});
});

//POST /users
app.post('/users', function (req,res) {
	var body = _.pick(req.body,'email','password');
	db.user.create(body).then(function (user) {
		res.json(user.toPublicJson());
	},function (e) {
		res.status(400).json(e);
	})
})

// DELETE /todos/:id
app.delete('/todos/:id', middleware.requireAuthentication, function (req, res) {
	var todoId = parseInt(req.params.id, 10);
	// var matchedTodo = _.findWhere(todos, {id: todoId});
	db.todo.findById(todoId).then(function (todo) {
		if (!!todo) {
			return todo.destroy();
			//res.json(todo.toJSON());
		} else {
			res.status(404).send();
		}
	}).then(function () {
		res.json({deleted : todoId});
	}).catch(function () {
		res.status(500).send();
	})
	// if (!matchedTodo) {
	// 	res.status(404).json({"error": "no todo found with that id"});
	// } else {
	// 	// todos = _.without(todos, matchedTodo);
	// 	res.json(matchedTodo);
	// }
});

//POST users/login

app.post('/users/login',function (req, res) {
	var body = _.pick(req.body,'email','password');
  db.user.authenticate(body).then(function (user) {
		var token = user.generateToken('authentication');
		if (token) {
			res.header('Auth',token).json(user.toPublicJson());
		}
		else {
			res.status(401).send();
		}
  },function (e) {
    res.status(401).send();
  })
})



// PUT /todos/:id
app.put('/todos/:id',  middleware.requireAuthentication, function (req, res) {
	var todoId = parseInt(req.params.id, 10);
	// var matchedTodo = _.findWhere(todos, {id: todoId});
	var body = _.pick(req.body, 'description', 'completed');
	var validAttributes = {};

	if (body.hasOwnProperty('completed')) {
		validAttributes.completed = body.completed;
	}

	if (body.hasOwnProperty('description')) {
		validAttributes.description = body.description;
	}

	db.todo.findById(todoId).then(function (todo) {
		if (todo) {
			return todo.update(validAttributes);
		} else {
			res.status(404).send();
		}
	},function () {
		res.status(500).send();
	}).then(function (todo) {
		res.json(todo.toJSON());
	},function (e) {
		res.status(400).json(e);
	})

});

db.sequelize.sync({force : true}).then(function () {
	app.listen(PORT, function () {
		console.log('Express listening on port ' + PORT + '!');
	});
});
