require("dotenv").config()

const app = require("./app")
const connectDB = require("./utils/db")

connectDB()

app.listen(4000, () => {
    console.log("Auth Server running on 4000")
})