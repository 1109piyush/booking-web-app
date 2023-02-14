const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const MONGODB_URL = process.env.MONGODB_URL

const ConnectToDB = () => {
    mongoose.connect(MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(console.log("DB CONNECTED with a success"))
    .catch((error) => {
        console.log("DB connection failed");
        console.log(error);
        process.exit(1)
    })
}

module.exports = ConnectToDB;