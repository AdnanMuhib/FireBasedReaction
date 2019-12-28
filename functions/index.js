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

const isEmpty = string => {
  if (string.trim() === "") return true;
  return false;
};
const isEmail = email => {
  const regEx =
    "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$";
  if (email.match(regEx)) return true;
  return false;
};
// signup route
app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };
  // validate data
  let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = "Must not be be Empty";
  } else if (!isEmail(newUser.email)) {
    errors.email = "Must be a valid email address";
  }

  if (isEmpty(newUser.password)) {
    errors.password = "Must not be empty";
  }

  if (newUser.password !== newUser.confirmPassword) {
    errors.confirmPassword = "Passwords must match";
  }

  if (isEmpty(newUser.handle)) errors.handle = "Must not be empty";

  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errors);
  }
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

// Login Route
app.post("/login", (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  // Validate Data
  let errors = {};
  if (isEmpty(user.email)) {
    errors.email = "Must not be empty";
  } else if (!isEmail(user.email)) {
    errors.email = "Should be Valid Email";
  }
  if (isEmpty(user.password)) {
    errors.password = "Must not be empty";
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errors);
  }
  // authenticate
  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/wrong-password")
        return res
          .status(403)
          .json({ general: "Wrong Credentials Please Try Again" });
      return res.status(500).json({ error: err.code });
    });
});
// https://baseurl.com/api/
exports.api = functions.https.onRequest(app);
