'use strict'

var knexOptions = require('./knexfile.js')[process.env.NODE_ENV || 'development']

var knex = require('knex')(knexOptions)

//var HQ = require('hq-pg')(knex)
var HQ = require('../../index.js')(knex) 

var Meals = new HQ.Model('meals')

var Ingredients = new HQ.Model('ingredients')

var Users = new HQ.UserModel('users')

var Devices = new HQ.DeviceModel('devices', {
	expiryCount: 5,
	expiryUnits: 'minutes'
})

var Groups = new HQ.Model('groups')

var Invites = new HQ.Model('invites')

var MealIngredients = new HQ.Model('meal_ingredients', {
	filterKnex(knex) {
		return knex
			.join('meals', 'meal_ingredients.meal_id', '=', 'meals.id')
			.join('ingredients', 'meal_ingredients.ingredient_id', '=', 'ingredients.id')
	}
})

module.exports = { 
	knex,
	Meals, 
	Ingredients, 
	Users,
	Groups,
	Devices,
	Invites,
	MealIngredients
}
