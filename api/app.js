require('dotenv').config();
var cors = require('cors')



const connectToDB = require("./db");

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User.js');
const Place = require('./models/Place.js');
const Booking = require('./models/Booking.js');
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const multer = require('multer');
const fs = require('fs');

const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'fasefraw4r5r3wq45wdfgw34twdfg';
// app.use(cors());
app.use(cors({
  credentials: true,
  // to communicate with frontend frontend url
  origin: ['http://localhost:3000', "https://rockstar-piyush.netlify.app","https://piyush-booking-app.netlify.app"],
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(express.urlencoded({ extended: true }));




function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}
connectToDB();

app.get('/test', (req, res) => {
  res.json('test ok');
});

app.post('/register', async (req, res) => {
  //collect all information
  const { name, email, password } = req.body;

  // create databse
  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }

});

app.post('/login', async (req, res) => {
  //collect all information

  const { email, password } = req.body;
  //check if user email is in databse

  const userDoc = await User.findOne({ email });
  if (userDoc) {
    // compare password
    const passOk = bcrypt.compareSync(password, userDoc.password);
    // if password is ok send jwt token in cookies ,payload email and id C
    if (passOk) {
      jwt.sign({
        email: userDoc.email,
        id: userDoc._id
      }, jwtSecret, {}, (err, token) => {
        if (err) throw err;
        // token value will be token  like token:token
        res.cookie('token', token, { sameSite: 'none', secure: true }).json(userDoc);
      });
    } else {
      res.status(422).json('pass not ok');
    }
  } else {
    res.json('not found');
  }
});

app.get('/profile', (req, res) => {
  // get token from cookies
  const { token } = req.cookies;
  if (token) {
    // verify token with seceret
    // userData is variable that contain all data of token we add at time of sending in cookies token like email and id
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      // from userdata we get id ,and from id we get all data name email ,id from database
      const { name, email, _id } = await User.findById(userData.id);
      // we send name ,email, id that we get from cookies and database
      res.json({ name, email, _id });
    });
  } else {
    res.json(null);
  }
});

app.post('/logout', (req, res) => {
  // at time of logout we are empty the token value that is why "" from cookies
  res.cookie('token', '').json(true);
});

// Image Downloader package
app.post('/upload-by-link', async (req, res) => {
  // get link from body
  try {
    const { link } = req.body;
    const newName = 'photo' + Date.now() + '.jpg';
    // saving image from given link in directory that is why __dirname   dir is full path of this folder
    await imageDownloader.image({
      url: link,
      dest: __dirname + '/uploads/' + newName,
    });
    res.json(newName);
  } catch (e) {
    res.status(422).json(e);
  }

});


//multer is to store photos 
const photosMiddleware = multer({ dest: 'uploads/' });
// photosMiddleware.array('photos', 5) is storing photos in array maximum count of 5
app.post('/upload', photosMiddleware.array('photos', 100), (req, res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname } = req.files[i];
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
    uploadedFiles.push(newPath.replace('uploads/', ''));
  }
  res.json(uploadedFiles);
});

// add place by login user  for accomdation
app.post('/places', (req, res) => {
  // get token from cookies and token 
  const { token } = req.cookies;
  // get all details from body
  const {
    title, address, addedPhotos, description, price,
    perks, extraInfo, checkIn, checkOut, maxGuests,
  } = req.body;
  // verify token
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    // from token we get id    userDtat.id and creating in database id of owner and log in will be same
    const placeDoc = await Place.create({
      owner: userData.id, price,
      title, address, photos: addedPhotos, description,
      perks, extraInfo, checkIn, checkOut, maxGuests,
    });
    res.json(placeDoc);
  });
});
// getting data of all places of particular user that is listed by him
app.get('/user-places', (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const { id } = userData;
    // sending place data after find by same owner id
    res.json(await Place.find({ owner: id }));
  });
});

// getting data of  places 

app.get('/places/:id', async (req, res) => {
  // get id from params means from url
  const { id } = req.params;
  res.json(await Place.findById(id));
});

// edit place
app.put('/places', async (req, res) => {
  const { token } = req.cookies;
  const {
    // id we get from frontend
    id, title, address, addedPhotos, description,
    perks, extraInfo, checkIn, checkOut, maxGuests, price,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.findById(id);
    //  we get userdata from token that contain id information from that checking userData.id is same place.doc 
    //  the place he is editting is of same person or not if place is of same person than edit it
    if (userData.id === placeDoc.owner.toString()) {
      placeDoc.set({
        title, address, photos: addedPhotos, description,
        perks, extraInfo, checkIn, checkOut, maxGuests, price,
      });
      await placeDoc.save();
      res.json('ok');
    }
  });
});

// get places for simple user
app.get('/places', async (req, res) => {
  res.json(await Place.find());
});


// Booking we already check token by function getUserDataFromReq written above
app.post('/bookings', async (req, res) => {
  const userData = await getUserDataFromReq(req);
  const {
    place, checkIn, checkOut, numberOfGuests, name, phone, price,
  } = req.body;
  Booking.create({
    place, checkIn, checkOut, numberOfGuests, name, phone, price,
    user: userData.id,
  }).then((doc) => {
    res.json(doc);
  }).catch((err) => {
    throw err;
  });
});



app.get('/bookings', async (req, res) => {
  const userData = await getUserDataFromReq(req);
  // find booking of particular user
  res.json(await Booking.find({ user: userData.id }).populate('place'));
});

module.exports = app

