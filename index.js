'use strict'

module.exports = function(knex) {

	class Model {

		constructor(tableName, options) {
			options = options || {}
			this.tableName = tableName
			this.timestamps = options.timestamps || {
				enabled: true,
				created: 'created_at',
				updated: 'updated_at'
			}
			this.filterKnex = options.filterKnex || null
		}

		knex() {
			var k = knex(this.tableName)
			if (this.filterKnex) {
				k = this.filterKnex(k)
			}
			return k
		}

		create(data, returning, onDone /* (err, data, status, message) */) {
			if (this.timestamps.enabled === true) {
				data[this.timestamps.created] = knex.fn.now()
				data[this.timestamps.updated] = knex.fn.now()
			}
			this.knex()
				.insert(data)
				.returning(returning || '*')
				.asCallback((err, rows) => {
					return onDone(err, rows ? rows[0] : null, this.suggestedStatus(err, rows ? rows[0] : null), this.suggestedMessage(err))
				})
		}

		batchCreate(data, filter /* func(query) */, onDone /* (err, data) */) {
			if (this.timestamps.enabled === true) {
				data[this.timestamps.created] = knex.fn.now()
				data[this.timestamps.updated] = knex.fn.now()
			}
			
			var query =	this.knex()
				.insert(data)
				.toString()
				+ ' ON CONFLICT ON CONSTRAINT ' + this.tableName + '_pkey DO NOTHING'

			if (filter) {
				query = filter(query)
			}

			knex.raw(query)
				.asCallback((err, rows) => {
					return onDone(err, rows)
				})
		}

		select(returning, onDone /* (err, data, status) */) {
			this.knex()
				.select(returning || '*')
				.asCallback((err, rows) => {
					return onDone(err, rows, this.suggestedStatus(err, rows))
				})
		}

		findAll(where, returning, onDone /* (err, data, status) */) {
			this.knex()
				.where(where)
				.select(returning || '*')
				.asCallback((err, rows) => {
					return onDone(err, rows, this.suggestedStatus(err, rows))
				})
		}

		find(where, returning, onDone /* (err, data, status) */) {
			this.knex()
				.where(where)
				.select(returning || '*')
				.first()
				.asCallback((err, row) => {
					return onDone(err, row, this.suggestedStatus(err, row))
				})
		}

		findById(id, returning, onDone /* (err, data, status) */) {
			return this.find({ id }, returning || null, onDone || null)
		}

		findOrCreate(data, returning, onDone /* (err, data, status, message) */) {
			this.knex()
				.where(data)
				.select(returning || '*')
				.first()
				.asCallback((err, row) => {
					if (err || row) { 
						return onDone(err, row, this.suggestedStatus(err, row), this.suggestedMessage(err)) 
					}
					if (this.timestamps.enabled === true) {
						data[this.timestamps.created] = knex.fn.now()
						data[this.timestamps.updated] = knex.fn.now()
					}
					this.knex()
						.insert(data)
						.returning(returning || '*')
						.asCallback((err, rows) => {
							return onDone(err, rows ? rows[0] : null, this.suggestedStatus(err, rows ? rows[0] : null), this.suggestedMessage(err))
						})
				})
		}

		updateAll(where, data, returning, onDone /* (err, data, status, message) */) {
			if (this.timestamps.enabled === true) {
				data[this.timestamps.updated] = knex.fn.now()
			}
			this.knex()
				.where(where)
				.returning(returning || '*')
				.update(data)
				.asCallback((err, rows) => {
					return onDone(err, rows, this.suggestedStatus(err, rows), this.suggestedMessage(err))
				})
		}

		update(where, data, returning, onDone /* (err, data, status, message) */) {
			if (this.timestamps.enabled === true) {
				data[this.timestamps.updated] = knex.fn.now()
			}
			this.knex()
				.where(where)
				.first()
				.returning(returning || '*')
				.update(data)
				.asCallback((err, rows) => {
					return onDone(err, rows ? rows[0] : null, this.suggestedStatus(err, rows ? rows[0] : null), this.suggestedMessage(err))
				})
		}

		destroy(where, onDone /* (err, data, status) */) {
			this.knex()
				.where(where)
				.del()
				.asCallback((err, row) => {
					return onDone(err, null, this.suggestedStatus(err, row))
				})
		}

		suggestedStatus(err, data) {
			if (err) { return 422 }
			if (!data) { return 400 }
			return 200
		}

		suggestedMessage(err) {
			if (!err) { return null }
			var errStr = err.toString()

			if (errStr.match(/\_unique/i)) { 
				var tableMatch = errStr.match(/into\s\"([^\"]+)\"/i)
				var tableColMatch = errStr.match(/\"([^\"]+)\_unique\"/i)
				if (tableMatch && tableColMatch) {
					var table = tableMatch[1]
					var tableCol = tableColMatch[1]
					var col = tableCol.replace(table + '_', '')
					if (col) {
						return `That ${col} value already exists...`
					}
				}
			}

			if (errStr.match(/null\svalue/i)) { 
				var match = errStr.match(/column\s\"([^\"]+)\"/i)
				if (match) { 
					if (match[1]) {
						return `No ${match[1]} value...`
					}
				}
			}

			return null
		}

	}


	class UserModel extends Model {

		constructor(tableName, options) {
			super(tableName, options)
			this.bcryptjs = require('bcryptjs')
			this._ = require('underscore')
		}

		//bcrypt hash contains the salt, making it easier for us to store
		generatePassword(password) {
			return this.bcryptjs.hashSync(password, 16)
		}

		passwordMatches(password, hash) {
			return this.bcryptjs.compareSync(password, hash)
		}

		create(data, returning, onDone /* (err, data, status, message) */) {
			if (data.password) {
				data.password = this.generatePassword(data.password)
			}
			return super.create(data, returning, onDone)
		}

		findOrCreate(data, returning, onDone /* (err, data, status, message) */) {
			if (data.password) {
				data.password = this.generatePassword(data.password)
			}
			return super.findOrCreate(data, returning, onDone)
		}

		safe(data) {
			return this._.omit(data, 'password')
		}

		validateLoginAndFind(email, password, onDone /* (err, data, status) */) {
			if (!email) { return onDone(null, null, 422, 'No email provided...') }
			if (!password) { return onDone(null, null, 422, 'No password provided...') }

			this.find({ email }, '*', (err, data, status) => {

				if (status >= 400) {
					return onDone(err, data, status)
				}

				if (!this.passwordMatches(password, data.password)) {
					return onDone(null, null, 401, 'Password did not match...')
				}

				return onDone(null, data, 200)

			})
		}

	}


	class DeviceModel extends Model {

		constructor(tableName, options) {
			options = options || {}
			super(tableName, options)
			this.expiryCount = options.expiryCount || 365
			this.expiryUnits = options.expiryUnits || 'days'
			this.uuidv4 = require('uuid/v4')
			this.moment = require('moment')
			this.requestIp = require('request-ip')
		}

		generateToken() {
			return this.uuidv4()
		}

		timeFormatted(m) {
			return m.utc().format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z'
		}

		dataForCreate(req, user_id) {
			var m = this.moment().add(this.expiryCount, this.expiryUnits)
			return {
				ip: this.requestIp.getClientIp(req),
				token: this.generateToken(),
				expiry: `${this.expiryCount} ${this.expiryUnits}`,
				expires_at: this.timeFormatted(m),
				user_id
			}
		}

		getTokenFromReq(req, header) {
			var header = header || 'X-Authorization'
			if (!req.headers) { return false }
			var token = req.headers[header.toLowerCase()]
			return token ? token : null
		}

		findByActiveToken(token, returning, onDone) {
			var m = this.moment()
			this.knex()
				.where({ token })
				.andWhere('expires_at', '>', this.timeFormatted(m))
				.select(returning || '*')
				.first()
				.asCallback((err, row) => {
					return onDone(err, row, this.suggestedStatus(err, row))
				})
		}

		expireAllByUserId(user_id, returning, onDone /* (err, data, status, message) */) {
			var m = this.moment()
			return this.updateAll({ user_id }, {	expires_at: this.timeFormatted(m)	}, returning || null, onDone || null)
		}

	}

	return { Model, UserModel, DeviceModel }

}