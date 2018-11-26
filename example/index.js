'use strict'

//deps
require('dotenv').config()
var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var _ = require('underscore')
var chalk = require('chalk')

var db = require('./db')
var Meals = db.Meals
var Ingredients = db.Ingredients
var Users = db.Users
var Groups = db.Groups
var Devices = db.Devices
var MealIngredients = db.MealIngredients

/* middleware */

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// /* handling users login */

app.post('/register', (req, res) => {

	Groups.create({}, '*', (err, data, status, message) => {
		if (status >= 400) { 
			if (err) { console.error(chalk.red(message, err)) }
			return res.status(status).send({ data, message })
		}

		req.body.group_id = data.id
		Users.create(req.body, '*', (err, data, status, message) => {
			if (err) { console.error(chalk.red(message, err)) }
			data = Users.safe(data || null)
			return res.status(status).send({ data, message })
		})

	})

})

app.post('/login', (req, res) => {
	//get access token, info on user and group in middleware

	Users.validateLoginAndFind(req.body.email, req.body.password, (err, user, status, message) => {
		if (status >= 400) {
			if (err) { console.error(chalk.red(message, err)) }
			data = Users.safe(data || null)
			return res.status(status).send({ data: user, message })
		}

		var data = Devices.dataForCreate(req, user.id)
		Devices.create(data, '*', (err, device, status, message) => {
			return res.status(status).send({ err, data: device, message })
		})
	})

})

var loadToken = (req, res, next) => {
	var token = Devices.getTokenFromReq(req)
	if (token === false) {
		var message = 'No headers were sent!'
		console.error(chalk.red(message))
		return res.status(400).send({ message })
	}
	if (token === null) {
		var message = 'Unauthorized! No token found.'
		console.error(chalk.red(message))
		return res.status(401).send({ message })
	}
	req.token = token
	next()
}

var lookupToken = (req, res, next) => {
	Devices.findByActiveToken(req.token, '*', (err, device, status) => {
		if (status >= 400) {
			var message = 'Unauthorized! Token either invalid or expired.'
			if (err) { console.error(chalk.red(message, err)) }
			return res.status(401).send({ message })
		}
		req.user_id = device.user_id
		next()
	})
}

var lookupUser = (req, res, next) => {
	Users.findById(req.user_id, '*', (err, user, status, message) => {
		if (status >= 400) {
			var message = 'Unauthorized! No matching user.'
			if (err) { console.error(chalk.red(message, err)) }
			return res.status(401).send({ message })
		}
		req.user = Users.safe(user)
		next()
	})
}

var lookupGroup = (req, res, next) => {
	if (!req.user) { return next() }
	Groups.findById(req.user.group_id, '*', (err, group, status, message) => {
		if (status < 400) {
			req.group = group
			req.body.group_id = group.id
		}
		next()
	})
}

var userAuth = [loadToken, lookupToken, lookupUser, lookupGroup]

app.get('/account', userAuth, (req, res) => {
	return res.status(200).send({
		data: {
			user: req.user,
			group: req.group
		}
	})
})

app.get('/logout', userAuth, (req, res) => {
	Devices.expireAllByUserId(req.user.id, '*', (err, devices, status, message) => {
		var message = ''
		if (status < 400) {
			message = 'All devices logged out!'
		}
		return res.status(status).send({ message })
	})
})

/* now handling users */

app.put('/account', userAuth, (req, res) => {
	Users.update({ id: req.user.id }, req.body, '*', (err, user, status, message) => {
		if (err) { console.error(chalk.red(message, err)) }
		var data = Users.safe(user)
		return res.status(status).send({ data, message })
	})
})

/* meals crud */

app.route('/meals')

	/* middleware to ensure requests are for user and group only */
	.all(userAuth)

	.post((req, res) => {
		Meals.findOrCreate(req.body, '*', (err, data, status, message) => {
			if (err) { console.error(chalk.red(message, err)) }
			return res.status(status).send({ data, message })
		})
	})

	.get((req, res) => {
		Meals.findAll({}, '*', (err, data, status) => {
			if (err) { console.error(chalk.red(err)) }
			return res.status(status).send({ data })
		})
	})

app.route('/meals/:meal_id')

	.all(userAuth, (req, res, next) => {
		req.id = req.params.meal_id
		Meals.find({ id: req.id }, '*', (err, data, status) => {
			if (status >= 400) { 
				if (err) { console.error(chalk.red(err)) }
				return res.status(status).send({ data: null })
			}
			req.meal = data
			next()
		})
	})

	.get((req, res) => {
		return res.status(200).send({ data: req.meal })
	})

	.put((req, res) => {
		Meals.update({ id: req.id }, req.body, '*', (err, data, status, message) => {
			if (err) { console.error(chalk.red(message, err)) }
			return res.status(status).send({ data, message })
		})
	})

	.delete((req, res) => {
		Meals.destroy({ id: req.id }, (err, data, status) => {
			if (err) { console.error(chalk.red(err)) }
			return res.status(status).send({ data })
		})
	})

/* ingredients crud */

app.route('/ingredients')

	/* middleware to ensure requests are for user and group only */
	.all(userAuth)

	.post((req, res) => {
		Ingredients.findOrCreate(req.body, '*', (err, data, status, message) => {
			if (err) { console.error(chalk.red(message, err)) }
			return res.status(status).send({ data, message })
		})
	})

	.get((req, res) => {
		Ingredients.findAll({}, '*', (err, data, status) => {
			if (err) { console.error(chalk.red(err)) }
			return res.status(status).send({ data })
		})
	})

app.route('/ingredients/:ingredient_id')

	.all(userAuth, (req, res, next) => {
		req.id = req.params.ingredient_id
		Ingredients.find({ id: req.id }, '*', (err, data, status) => {
			if (status >= 400) { 
				if (err) { console.error(chalk.red(err)) }
				return res.status(status).send({ data: null })
			}
			req.ingredient = data
			next()
		})
	})

	.get((req, res) => {
		return res.status(200).send({ data: req.ingredient })
	})

	.put((req, res) => {
		Ingredients.update({ id: req.id }, req.body, '*', (err, data, status, message) => {
			if (err) { console.error(chalk.red(message, err)) }
			return res.status(status).send({ data, message })
		})
	})

	.delete((req, res) => {
		Ingredients.destroy({ id: req.id }, (err, data, status) => {
			if (err) { console.error(chalk.red(err)) }
			return res.status(status).send({ data })
		})
	})


/* associating ingredients with meals */

app.route('/meals/:meal_id/ingredients')

	.all(userAuth)

	.get((req, res) => {
		MealIngredients.findAll({
			'meal_ingredients.meal_id': req.params.meal_id
		}, 'ingredients.*', (err, data, status) => {
			if (err) { console.error(chalk.red(err)) }
			return res.status(status).send({ data })
		})
	})

app.route('/meals/:meal_id/ingredients/:ingredient_id')

	.all(userAuth)

	.post((req, res) => {
		MealIngredients.create({
			meal_id: req.params.meal_id,
			ingredient_id: req.params.ingredient_id,
			group_id: req.group.id
		}, '*', (err, data, status, message) => {
			if (err) { console.error(chalk.red(message, err)) }
			return res.status(status).send({ data, message })
		})
	})

	.put((req, res) => {
		MealIngredients.update({
			meal_id: req.params.meal_id,
			ingredient_id: req.params.ingredient_id,
		}, req.body, '*', (err, data, status, message) => {
			if (err) { console.error(chalk.red(message, err)) }
			return res.status(status).send({ data, message })
		})
	})

	.delete((req, res) => {
		MealIngredients.destroy({
			meal_id: req.params.meal_id,
			ingredient_id: req.params.ingredient_id,
		}, (err, data, status) => {
			if (err) { console.error(chalk.red(err)) }
			return res.status(status).send({ data })
		})
	})


//start
app.listen(process.env.EXPRESS_PORT, function() {
	console.log(`Started on port ${process.env.EXPRESS_PORT}...`)
})

module.exports = app







