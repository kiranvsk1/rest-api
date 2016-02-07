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

// POST /todos
app.post('/todos',middleware.requireAuthentication, function (req, res) {
	var body = _.pick(req.body, 'description', 'completed');
	db.todo.create(body).then(function (todo) {
		req.user.addTodo(todo).then(function () {
			return todo.reload();
		}).then(function (todo) {
			res.json(todo);
		})
	},function (e) {
		res.status(400).json(e);
	});
});

// PUT /todos/:id
app.put('/todos/:id',  middleware.requireAuthentication, function (req, res) {
	var todoId = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'description', 'completed');
	var validAttributes = {};

	if (body.hasOwnProperty('completed')) {
		validAttributes.completed = body.completed;
	}

	if (body.hasOwnProperty('description')) {
		validAttributes.description = body.description;
	}

	db.todo.findOne({where : {id: todoId, userId: req.user.get('id')}}).then(function (todo) {
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


// GET /todos?completed=false&q=work
app.get('/todos', middleware.requireAuthentication, function (req, res) {
	var queryParams = req.query;
	var where = { userId:req.user.get('id')};

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
});

// GET /todos/:id
app.get('/todos/:id', middleware.requireAuthentication, function (req, res) {
	var todoId = parseInt(req.params.id, 10);
	db.todo.findOne({where : {id: todoId, userId: req.user.get('id')}}).then(function (todo) {
		if (!!todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).send();
		}
	},function () {
		res.status(500).send();
	})
});

// DELETE /todos/:id
app.delete('/todos/:id', middleware.requireAuthentication, function (req, res) {
	var todoId = parseInt(req.params.id, 10);
	db.todo.findOne({
		where :	{
				id: todoId,
				userId: req.user.get('id')
			}
		}).then(function (todo) {
		if (!!todo) {
			return todo.destroy();
		} else {
			res.status(404).send();
		}
	}).then(function () {
		res.json({deleted : todoId});
	}).catch(function () {
		res.status(500).send();
	})
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



//POST users/login

app.post('/users/login',function (req, res) {
	var body = _.pick(req.body,'email','password');
	//console.log(body);
	var userInstance;
  db.user.authenticate(body).then(function (user) {
		// console.log(user);
		var token = user.generateToken('authentication');
		//console.log(token);
		userInstance = user;
		return db.token.create({token: token});
  }).then(function (tokenInstance) {
		// console.log('tokenInstance');
		// console.log(tokenInstance.get('token'));
		//console.log(userInstance);
		console.log(userInstance);
		res.header('Auth',tokenInstance.get('token')).json(userInstance.toPublicJson());
  }).catch( function () {
    res.status(401).send();
  })
});

//Delete users/logout

app.delete('/users/logout',middleware.requireAuthentication,function (req, res) {
	console.log('/users/logout');
	console.log(req.token);
	req.token.destroy().then(function () {
		res.status(204).send();
	}).catch(function () {
		res.status(500).send();
	})
})

db.sequelize.sync({force : true}).then(function () {
	app.listen(PORT, function () {
		console.log('Express listening on port ' + PORT + '!');
	});
});
