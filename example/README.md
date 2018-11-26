# hq-pg example

Pretty straight forward after you pop in your .env variables (look to example.env for the fields expected). Here are some cURL commands that can help you test and see this example in action:

#### Register User
Creates your new user.
```
curl -X POST \
  http://localhost:3000/register \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'cache-control: no-cache' \
  -d 'email=me%40domain.com&password=pass'
```

#### Login User
User logins with his/her device. Gets an access token in exchange. (Notice it's the same as register, but using a different endpoint.)
```
curl -X POST \
  http://localhost:3000/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'cache-control: no-cache' \
  -d 'email=me%40domain.com&password=pass'
```

#### Get User Account
With that access token received from login, you persist that token in your app. With that token, any successful request must contain the header "X-Authorization: YOUR_TOKEN_RECEIVED_FROM_LOGIN_ENDPOINT".
```
curl -X GET \
  http://localhost:3000/account \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'X-Authorization: YOUR_TOKEN_RECEIVED_FROM_LOGIN_ENDPOINT' \
  -H 'cache-control: no-cache'
```
