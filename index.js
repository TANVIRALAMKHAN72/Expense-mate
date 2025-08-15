require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { ObjectId } = require("mongodb");

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@nexus0.ytaptl9.mongodb.net/?retryWrites=true&w=majority&appName=Nexus0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let expensesCollection;

async function run() {
  try {
    await client.connect();
    const db = client.db("Money_Mate");
    expensesCollection = db.collection("expenses");
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    app.listen(port, () => {
      console.log(`Moneymate server is running on port ${port}`);
    });

  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}
run().catch(console.dir);

app.use(cors());
app.use(express.json());

app.post("/api/expenses", async (req, res) => {
  try {
    const expense = req.body;
    if (!expense.title || !expense.amount || !expense.date) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }
    expense.date = new Date(expense.date);
    const result = await expensesCollection.insertOne(expense);
    res.status(201).json({ message: "Expense saved successfully!", data: result });
  } catch (error) {
    res.status(500).json({ message: "Error saving expense", error });
  }
});

app.get("/api/expenses", async (req, res) => {
  try {
    const expenses = await expensesCollection.find().toArray();
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching expenses", error });
  }
});

app.get("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  try {
    const expense = await expensesCollection.findOne({ _id: new ObjectId(id) });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.status(200).json(expense);
  } catch (error) {
    console.error("Fetch Single Expense Error:", error);
    res.status(500).json({ message: "Error fetching expense", error: error.message });
  }
});

app.put("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  const { title, amount, category } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  try {
    const updateDoc = {
      $set: {
        title,
        amount: Number(amount),
        category,
      },
    };
    const result = await expensesCollection.updateOne(
      { _id: new ObjectId(id) },
      updateDoc
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Expense not found or no changes made" });
    }
    
    res.status(200).json({ message: "Expense updated successfully!" });
  } catch (err) {
    console.error("Server Error during update:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  try {
    const result = await expensesCollection.deleteOne({
      _id: new ObjectId(id),
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No expense found with that ID" });
    }
    
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Error deleting expense", error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('Moneymate server is running!');
});