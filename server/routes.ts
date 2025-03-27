import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)
  
  // Serve static files from the public directory
  app.use(express.static(path.join(process.cwd(), 'public')));
  
  // Route for CRM test page
  app.get('/crm-test.html', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'crm-test.html'));
  });

  const httpServer = createServer(app);

  return httpServer;
}
