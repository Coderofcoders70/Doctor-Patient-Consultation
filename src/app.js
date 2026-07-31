const express = require('express');
const prisma = require('./config/db');

require('dotenv').config();

const app = express();
app.use(express.json());

// API Routes
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.use('/auth', authRoutes);
app.use('/doctors', doctorRoutes);

// mounting both to the consultations path
app.use('/consultations', consultationRoutes);
app.use('/consultations', chatRoutes);

// Check the health of route
app.get('/health', async (req, res) => {
  try {
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