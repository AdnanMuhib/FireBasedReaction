const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firebase = require("firebase");
const app = require("express")();
const firebaseConfig = require("./config");

admin.initializeApp();

firebase.initializeApp(firebaseConfig);
const db = admin.firestore();
// Get a list of screams
app.get("/screams", (req, res) => {
  db.collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let screams = [];
      data.forEach(doc => {
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(screams);
    })
    .catch(err => console.error(err));
});

// post a new scream to database
app.post("/scream", (req, res) => {
  const newScream = {
    userHandle: req.body.userHandle,
    body: req.body.body,
    createdAt: new Date().toISOString()
  };

  db.collection("screams")
    .add(newScream)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully` });
      return res;
    })
    .catch(err => {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
      return res;
    });
});

// signup route
app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };
  // validate data
  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "this handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      };
      // store in the firebase collection of users
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      // return response with auth token
      return res.status(201).json({
        token
      });
    })
    .catch(err => {
      console.log(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "This Email is already in use" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});
// https://baseurl.com/api/
exports.api = functions.https.onRequest(app);
