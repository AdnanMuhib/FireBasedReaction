const functions = require("firebase-functions");
const app = require("express")();

const FireBaseAuth = require("./util/fbAuth");
const { getAllScreams, createScream } = require("./handlers/screams");
const { signup, login } = require("./handlers/users");

// Screams routes
app.get("/screams", getAllScreams);
app.post("/scream", FireBaseAuth, createScream);
// users routes
app.post("/signup", signup);
app.post("/login", login);

// https://baseurl.com/api/
exports.api = functions.https.onRequest(app);
