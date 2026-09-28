import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import dns from 'node:dns/promises';// Load .env variables
dotenv.config();

const PORT = process.env.PORT || 5000;
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();