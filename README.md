# hq-pg

### Installation
```
npm install hq-pg --save
```

### Getting Started
```
//initialize the module with your knex instance
var HQ = require('hq-pg')(knex)

//start defining your models
var Items = new HQ.Model('items')

var Locations = new HQ.Model('locations')

var Users = new HQ.UserModel('users')

var Devices = new HQ.DeviceModel('devices', {
	expiryCount: 1,
	expiryUnits: 'day'
})

var ItemsLocations = new HQ.Model('items_locations', {
	filterKnex(knex) {
		return knex
			.join('items', 'items_locations.item_id', '=', 'items.id')
			.join('locations', 'items_locations.location_id', '=', 'locations.id')
	}
})

//see them in action
Users.create({ email: 'me@domain.com', password: 'test' }, '*', console.log)
```


### require('hq-pg')(knex)
Returns three classes: ```Model```, ```UserModel```, and ```DeviceModel```:


### HQ.Model Methods
All of these methods can be extended or redefined through normal model inheritance.

```
create(data, returning, onDone(err, data, status, message) )

batchCreate(data, onDone(err, data) )
/ /where on conflict, the row attempted to be inserted does nothing

select(returning, onDone(err, data, status) )

findAll(where, returning, onDone(err, data, status) )

find(where, returning, onDone(err, data, status) )

findById(id, returning, onDone(err, data, status) )

findOrCreate(data, returning, onDone(err, data, status, message) )

updateAll(where, data, returning, onDone(err, data, status, message) )

update(where, data, returning, onDone(err, data, status, message) )

destroy(where, onDone(err, data, status) )
```

### HQ.UserModel Methods
All of these methods can be extended or redefined through normal model inheritance. (These all are in addition to those available in the Model class.)

```
generatePassword(password)

passwordMatches(password, hash)

safe(data)

validateLoginAndFind(email, password, onDone(err, data, status) )
```

### HQ.DeviceModel Methods
All of these methods can be extended or redefined through normal model inheritance. (These all are in addition to those available in the Model class.)

```
generateToken()

timeFormatted(m)

dataForCreate(req, user_id)

getTokenFromReq(req, header) 

findByActiveToken(token, returning, onDone(err, data, status) )

expireAllByUserId(user_id, returning, onDone(err, data, status, message) )
```

### Example
Comes with a fully fleshed out example, so you can see this in action and start implementing in your project.

#### Getting Started with the Example

1. Clone this repo and start there;
1. ```npm install knex -g```, if you don't have Knex CLI already installed;
1. ```npm install``` if you haven't already;
1. Create your ```.env``` file in the ```example``` folder of this repo. Make sure it contains the variables specified in ```example.env```
1. ```npm run example:migrate:latest``` to ensure our table schemas;
1. ```npm run example```

For cURL samples using the example application, look to the README in the ```example``` folder.



