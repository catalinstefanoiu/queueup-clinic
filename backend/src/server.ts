// Entry point: starts the HTTP server
import { app } from './app.ts';

// Cloud Run gives us the port in the PORT environment variable; locally we use 8080
const port = Number(process.env.PORT ?? 8080);

// Start listening for HTTP requests on that port
app.listen(port, (error) => {
  if (error) throw error; // e.g. the port is already in use
  console.log(`QueueUp backend listening on http://localhost:${port}`);
});
