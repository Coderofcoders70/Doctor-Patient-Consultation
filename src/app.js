const express = require('express');
const prisma = require('./config/db');
require('dotenv').config();

const app = express();
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    // to fetch a single record for now to confirm database access
    await prisma.user.findFirst();
    res.status(200).json({ 
      status: 'success', 
      message: 'API is running and Database is connected successfully!' 
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed' 
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});