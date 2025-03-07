const mongoose = require("mongoose");

const ProductionSchema = new mongoose.Schema({
    name: String,
    status: { type: String, enum: ["Planned", "In Progress", "Completed"], default: "Planned" },
    productionDate: Date,
});

module.exports = mongoose.model("Production", ProductionSchema);
