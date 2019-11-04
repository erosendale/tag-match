# tag-match
Tag matching app made in node js express

The purpose of this app was to try out using a graphing database (Neo4j in this case) to create a geospatial web of people that can find others nearby with similar interests. 

The app uses nodejs-passport for authentication/authorization. A user inputs their identity information (in this case just email address) and then a password for their account. Passport then creates an account with this information, storing it in a MongoDB database, and returning the users generated id.

When the user logs in, passport it generates a JWT with the user's identity, and the key is then given to the swagger interface to use as the Authorization header for the requests to the backend. All the requests will go through the passport middleware first to verify the token.

Once logged in, a user can create a profile for themselves including their age, location, and interests.
They can then use the find feature to find other people nearby in their age range with at least one shared interest.
Then they can like other users that they are interested in connecting with from the find feature.

Further updates to this app would include a matches feature to return users that have matched with the logged in user, as well as a chat feature.

Local testing:
Navigate to local_stack/
sh script/build.sh
sh script/start.sh

Navigate back to the route
npm test

Launch the app:
npm run start
