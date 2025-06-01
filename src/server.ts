// src/server.ts
import app from "./app"
// require('./jobs/autoCron.scheduler');
// import { connectDB } from './config/database';
// import { PORT } from './config';
// import { setupSocketIO } from './sockets'; // Assuming you'll add this later

const startServer = async () => {
  try {
    // await connectDB();
    const server = app.listen(process.env.PORT, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${process.env.PORT}`);
    });

    // Setup Sockzet.IO
    // setupSocketIO(server);

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1); // Exit with a failure code
  }
};

startServer();

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});