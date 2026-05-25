require("dotenv").config()

const mongoose = require("mongoose")

const app = require("./app")

mongoose.connect(process.env.MONGO_URI)

app.listen(5000, () => {
  console.log("App Backend running on 5000")
})