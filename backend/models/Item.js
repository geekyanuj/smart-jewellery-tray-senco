const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  epc: { type: String, required: true, unique: true },
  name: String,
  video: String,
});

module.exports = mongoose.model("Item", itemSchema);