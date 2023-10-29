var mongoose = require("mongoose");
var streamifier = require("streamifier");
const FileService = require("./services/fileService");
const busboyBodyParser = require("busboy-body-parser");
const express = require("express");
var cors = require("cors");

const { port, db } = require("./config/vars");

const app = express();
app.use(cors());
app.use(busboyBodyParser({ limit: "50mb" }));

app.get("/", async (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.post("/upload/file", async (req, res) => {
  try {
    let fileName = req.files.file.name;
    let fileType = req.files.file.mimetype;
    let fileSize = req.files.file.size;

    const storedName = `/upload/file/${fileName.replaceAll(" ", "_")}`;

    await FileService.addFileRecord({
      link: storedName,
      type: fileType,
      size: fileSize,
    });
    var gridfsbucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "files",
    });
    streamifier
      .createReadStream(req.files.file.data)
      .pipe(gridfsbucket.openUploadStream(storedName))
      .on("error", async function (error) {
        await FileService.removeFileRecord(storedName);
        res.status(404).json({
          msg: error.message,
        });
      })
      .on("finish", async function (data) {
        console.log("file data:", data);
        await FileService.updateFileRecord(storedName, {
          gridFS: data._id,
          checksum: data.md5,
        });
        res.status(200).json({
          success: true,
          fileLink: storedName,
          msg: "File Uploaded successfully",
        });
      });
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
});

app.get("/upload/file/:fileName", async (req, res) => {
  try {
    const storedLink = req.originalUrl;

    const fileData = await FileService.getFileRecord(storedLink);
    res.header("Content-type", fileData.type);
    var gridfsbucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "files",
    });

    gridfsbucket
      .openDownloadStreamByName(fileData.link)
      .pipe(res)
      .on("error", function (error) {
        console.log("error" + error);
        res.status(404).json({
          msg: error.message,
        });
      })
      .on("finish", function () {
        console.log("done!");
      });
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
});

app.delete("/upload/file/:fileName", async (req, res) => {
  try {
    const storedLink = req.originalUrl;
    const fileData = await FileService.getFileRecord(storedLink);
    var gridfsbucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "files",
    });
    await gridfsbucket.delete(fileData.gridFS);
    await FileService.removeFileRecord(storedLink);
    res.status(200).json({
      msg: "File removed",
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
});
mongoose.set("strictQuery", true);

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    connectTimeoutMS: 3600000,
    keepAlive: true,
    socketTimeoutMS: 3600000,
  })
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`GFS file upload listening on port: ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
    console.log("Unable to connect to database");
  });
