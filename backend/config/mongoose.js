import mongoose  from "mongoose"; 

mongoose.connect(`mongodb://localhost:27017/${process.env.CHAT_DB}`);

const db = mongoose.connection;

db.once('open', function() {
    console.log('Connected to Datbase :: MongoDB');
});

export default db;