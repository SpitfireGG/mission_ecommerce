require('dotenv').config()
const mongoose=require("mongoose")

// Give up on an unreachable server in 5s rather than Mongoose's default 30s.
const SERVER_SELECTION_TIMEOUT_MS=5000

exports.connectToDB=async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI,{serverSelectionTimeoutMS:SERVER_SELECTION_TIMEOUT_MS})
        console.log('connected to DB');
    } catch (error) {
        // Without a database every request would hang for 10s and then fail
        // with a 500, which hides the real cause. Stop here and say what to do.
        console.error(`\nCould not connect to MongoDB at ${process.env.MONGO_URI}`)
        console.error(`  ${error.message}\n`)
        console.error('Start the database, then run this again:')
        console.error('  docker start mern-mongo\n')
        process.exit(1)
    }
}
