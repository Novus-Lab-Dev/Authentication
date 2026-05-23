const users = [
  {
    id: "1",
    email: "test@example.com",
    password: "123456",
  },
];

const refreshTokens = new Map(); 
// userId -> refreshToken

module.exports = {
  users,
  refreshTokens,
};
