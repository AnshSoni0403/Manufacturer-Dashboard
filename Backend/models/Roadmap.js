const mongoose = require("mongoose");

const RoadmapSchema = new mongoose.Schema({
    phase: String,
    description: String,
    dueDate: Date,
    completed: { type: Boolean, default: false }
});

module.exports = mongoose.model("Roadmap", RoadmapSchema);
