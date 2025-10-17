


  const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ MySQL Connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Yash@2005",
  database: "pneumocare"
});

// ✅ Home
app.get("/", (req, res) => res.render("home"));

// ✅ About
app.get("/about", (req, res) => res.render("about"));

// ✅ Add Patient Page
app.get("/add", (req, res) => res.render("addPatient", { error: null }));

// ✅ Handle Add Patient
app.post("/add", (req, res) => {
  const { name, age, wbc, neutrophil, crp, oxygen } = req.body;

  // Validation
  if (!name || !age || !wbc || !neutrophil || !crp || !oxygen) {
    return res.render("addPatient", { error: "Please enter all values!" });
  }

  const id = uuidv4();
  const wbcNum = Number(wbc);
  const neutNum = Number(neutrophil);
  const crpNum = Number(crp);
  const oxyNum = Number(oxygen);

  // // Pneumonia logic
  let result = "Maybe Pneumonia";
  if (wbcNum > 11000 && neutNum > 70 && crpNum > 10 && oxyNum < 95) {
    result = "Suffering from Pneumonia";
  } else if (wbcNum < 11000 && neutNum < 70 && crpNum < 10 && oxyNum >= 95) {
    result = "Normal / Not Pneumonia";
  }


  const query = `
    INSERT INTO pneumo (id, sname, age, WBC_Count, Neutrophils_Percent, CRP_Level, Oxygen_Level, Result)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [id, name, age, wbcNum, neutNum, crpNum, oxyNum, result];

  connection.query(query, values, (err) => {
    if (err) {
      console.error("MySQL Insert Error:", err);
      return res.send("Error saving patient data. Check server logs.");
    }
    res.redirect(`/report/${id}`);
  });
});

// ✅ Report Page (Single Patient)
app.get("/report/:id", (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM pneumo WHERE id = ?";
  connection.query(query, [id], (err, results) => {
    if (err) return res.send("Error fetching report.");
    if (results.length === 0) return res.send("Report not found.");
    res.render("report", { patient: results[0] });
  });
});

// ✅ View All Reports
app.get("/reports", (req, res) => {
  const query = "SELECT * FROM pneumo ORDER BY id DESC";
  connection.query(query, (err, results) => {
    if (err) return res.send("Error fetching reports.");
    res.render("viewReports", { patients: results });
  });
});

// ✅ Delete One Report
app.post("/delete/:id", (req, res) => {
  const { id } = req.params;
  connection.query("DELETE FROM pneumo WHERE id = ?", [id], (err) => {
    if (err) return res.send("Error deleting record.");
    res.redirect("/reports");
  });
});

// ✅ Delete All Reports
app.post("/deleteAll", (req, res) => {
  connection.query("DELETE FROM pneumo", (err) => {
    if (err) return res.send("Error deleting all records.");
    res.redirect("/reports");
  });
});

// ✅ Start Server
app.listen(3000, () =>
  console.log("✅ Server running on http://localhost:3000")
);
