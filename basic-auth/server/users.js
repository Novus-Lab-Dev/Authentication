const bcrypt = require("bcrypt");

const users = [
    {
        username: "admin",
        passwordHash: bcrypt.hashSync("1234", 10),
    },
];

module.exports = users;