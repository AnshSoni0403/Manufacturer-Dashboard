const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect("mongodb://127.0.0.1:27017/productionDashboard", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

const WeekSchema = new mongoose.Schema({
  week: { type: String, required: true },
  production: { type: Number, default: 0 },
  sugarUsed: { type: Number, default: 0 },
  mangoPulpUsed: { type: Number, default: 0 }
});

const DashboardSchema = new mongoose.Schema({
  month: { type: String, required: true, unique: true },
  targetProduction: { type: Number, default: 0 },
  weeks: [WeekSchema],  
  rawMaterialsBought: {
    sugar: { type: Number, default: 0 },
    mangoPulp: { type: Number, default: 0 }
  },
  actualProduction: { type: Number, default: 0 },
  carryover: { type: Number, default: 0 }
});

const Dashboard = mongoose.model("Dashboard", DashboardSchema);

// Fetch all dashboard entries
app.get("/api/dashboard", async (req, res) => {
  try {
    const data = await Dashboard.find({});
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add or update a monthly dashboard entry
app.post("/api/dashboard", async (req, res) => {
  try {
    const { month, targetProduction, weeks = [], rawMaterialsBought, actualProduction } = req.body;

    // Calculate total weekly production
    const totalWeeklyProduction = weeks.reduce((sum, week) => sum + (Number(week.production) || 0), 0);
    const actualProd = actualProduction !== undefined ? Number(actualProduction) || 0 : totalWeeklyProduction;
    const carryover = actualProd - (Number(targetProduction) || 0);

    let entry = await Dashboard.findOne({ month });

    if (entry) {
      entry.targetProduction = Number(targetProduction) || 0;
      entry.weeks = weeks;
      entry.rawMaterialsBought = rawMaterialsBought;
      entry.actualProduction = actualProd;
      entry.carryover = carryover;
    } else {
      entry = new Dashboard({
        month,
        targetProduction: Number(targetProduction) || 0,
        weeks,
        rawMaterialsBought,
        actualProduction: actualProd,
        carryover
      });
    }

    await entry.save();
    res.json({ message: "Dashboard entry saved successfully!", data: entry });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate AI-driven recommendations
app.get("/api/recommendations", async (req, res) => {
  try {
    const entries = await Dashboard.find({});
    const recommendations = entries.map(entry => {
      const totalProduction = entry.weeks.reduce((sum, week) => sum + (Number(week.production) || 0), 0);
      const diff = entry.targetProduction - totalProduction;
      let overall, shortTerm, longTerm, weekly = [];

      if (diff > 0) {
        overall = `Production is behind by ${diff} units in ${entry.month}. Immediate action required.`;
        shortTerm = [
          `Increase production in upcoming weeks by approximately ${diff} units.`,
          `Ensure raw materials availability: roughly ${Math.ceil(diff / 5)} kg sugar and ${Math.ceil((diff / 5) * 0.5)} kg mango pulp extra.`
        ];
        longTerm = [
          `Review labor allocation and process efficiency for ${entry.month}.`,
          `Consider automation improvements for sustainable growth.`
        ];
        entry.weeks.forEach((week, idx) => {
          if (week.production < entry.targetProduction / 4) {
            weekly.push(`Week ${idx + 1} is below expected output. Adjust shifts and resources.`);
          } else {
            weekly.push(`Week ${idx + 1} is on track.`);
          }
        });
      } else {
        overall = `Production meets or exceeds the target in ${entry.month}.`;
        shortTerm = ["Maintain current production strategies."];
        longTerm = ["Plan for inventory optimization and process improvements."];
        entry.weeks.forEach((week, idx) => {
          weekly.push(`Week ${idx + 1} is on track.`);
        });
      }

      return {
        month: entry.month,
        recommendation: { overall, shortTerm, longTerm, weekly }
      };
    });

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
