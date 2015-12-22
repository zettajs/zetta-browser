# The Zetta Browser

This is an easily deployable API browser for the Zetta project. Visualize your APIs, data streams, and interactions with devices.

# Building Locally

To build the browser for local development do the following.

1. run `npm install`
2. run `npm install -g gulp`
3. run `gulp`

# Building Heroku

1. Create a new app for heroku `heroku apps:create z-browser`
2. Set the buildpack to the gulp buildpack `heroku buildpacks:set https://github.com/appstack/heroku-buildpack-nodejs-gulp.git`
3. Set the node env variable to production `heroku config:set NODE_ENV=production`
4. Push your branch to heroku `git push heroku master` 

