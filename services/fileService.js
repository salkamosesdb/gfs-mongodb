const File = require("../models/fileModel");

exports.getFileRecord = async (fileLink) => {
  const file = await File.findOne({ link: fileLink }).catch((err) => {
    throw new Error(err.message);
  });
  if (!file) {
    throw new Error("File not found");
  }
  return file;
};

exports.addFileRecord = async (data) => {
  const existFile = await File.findOne({
    link: data.link,
  }).catch((err) => {
    throw new Error(err.message);
  });
  if (existFile) {
    throw new Error("File path already exist");
  }
  const newFile = new File(data);
  return newFile.save().catch((err) => {
    throw new Error(err.message);
  });
};

exports.updateFileRecord = async (link, data) => {
  await File.updateOne({ link }, data);
};

exports.removeFileRecord = async (fileLink) => {
  const existFile = await File.findOne({
    link: fileLink,
  }).catch((err) => {
    throw new Error(err.message);
  });
  if (existFile) {
    return await File.deleteOne({ link: fileLink }).catch((err) => {
      throw new Error(err.message);
    });
  }
};
