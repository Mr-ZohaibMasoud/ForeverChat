// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000, // Ensure your dev server is running on the same port
    open: true, // Automatically open browser on start
  },
  define: {
    "process.env": {}, // Helps prevent certain errors related to environment variables
  },
});
