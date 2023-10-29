module.exports = {
  port: process.env.PORT ? process.env.PORT : 3000,
  db: process.env.DB ? process.env.DB : "mongodb://127.0.0.1:27017/file",
};
