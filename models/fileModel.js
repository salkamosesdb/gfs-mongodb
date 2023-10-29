const mongoose = require("mongoose");

const fileModel = new mongoose.Schema(
  {
    link: { type: String, unique: true, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    checksum: { type: String },
    gridFS: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

fileModel.index({ link: 1 });

module.exports = mongoose.model("File", fileModel);
