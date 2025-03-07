const express = require("express");
const router = express.Router();
const Production = require("../models/Production");

router.get("/", async (req, res) => {
    const productions = await Production.find();
    res.json(productions);
});

router.post("/", async (req, res) => {
    const production = new Production(req.body);
    await production.save();
    res.json(production);
});

router.put("/:id", async (req, res) => {
    const production = await Production.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(production);
});

router.delete("/:id", async (req, res) => {
    await Production.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

module.exports = router;
