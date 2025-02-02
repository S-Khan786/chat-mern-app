// import mongoose  from "mongoose"; 

// mongoose.connect(`mongodb://localhost:27017/${process.env.CHAT_DB}`);

// const db = mongoose.connection;

// db.once('open', function() {
//     console.log('Connected to Datbase :: MongoDB');
// });

// export default db;

import mongoose from "mongoose";

const dbConnect = async() => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECT),
        console.log("DB CONNECTED SUCCESSFULLY")
    } catch(err) {
        console.log(err);
    }
}

export default dbConnect;