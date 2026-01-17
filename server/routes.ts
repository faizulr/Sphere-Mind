import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIdeaSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get all ideas
  app.get("/api/ideas", async (req, res) => {
    try {
      const allIdeas = await storage.getAllIdeas();
      res.json(allIdeas);
    } catch (error) {
      console.error("Error fetching ideas:", error);
      res.status(500).json({ error: "Failed to fetch ideas" });
    }
  });

  // Get single idea
  app.get("/api/ideas/:id", async (req, res) => {
    try {
      const idea = await storage.getIdea(req.params.id);
      if (!idea) {
        return res.status(404).json({ error: "Idea not found" });
      }
      res.json(idea);
    } catch (error) {
      console.error("Error fetching idea:", error);
      res.status(500).json({ error: "Failed to fetch idea" });
    }
  });

  // Create new idea
  app.post("/api/ideas", async (req, res) => {
    try {
      const validationResult = insertIdeaSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: fromZodError(validationResult.error).toString() 
        });
      }

      const newIdea = await storage.createIdea(validationResult.data);
      res.status(201).json(newIdea);
    } catch (error) {
      console.error("Error creating idea:", error);
      res.status(500).json({ error: "Failed to create idea" });
    }
  });

  // Update idea
  app.patch("/api/ideas/:id", async (req, res) => {
    try {
      const validationResult = insertIdeaSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: fromZodError(validationResult.error).toString() 
        });
      }

      const updatedIdea = await storage.updateIdea(req.params.id, validationResult.data);
      if (!updatedIdea) {
        return res.status(404).json({ error: "Idea not found" });
      }
      
      res.json(updatedIdea);
    } catch (error) {
      console.error("Error updating idea:", error);
      res.status(500).json({ error: "Failed to update idea" });
    }
  });

  // Delete idea (and all children recursively)
  app.delete("/api/ideas/:id", async (req, res) => {
    try {
      // Helper function to get all descendants
      const getAllDescendants = async (parentId: string): Promise<string[]> => {
        const allIdeas = await storage.getAllIdeas();
        const children = allIdeas.filter(i => i.parentId === parentId);
        const childIds = children.map(c => c.id);
        
        const descendants: string[] = [];
        for (const childId of childIds) {
          descendants.push(childId);
          const childDescendants = await getAllDescendants(childId);
          descendants.push(...childDescendants);
        }
        
        return descendants;
      };

      const descendantIds = await getAllDescendants(req.params.id);
      
      // Delete all descendants first
      for (const descendantId of descendantIds) {
        await storage.deleteIdea(descendantId);
      }
      
      // Then delete the parent
      await storage.deleteIdea(req.params.id);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting idea:", error);
      res.status(500).json({ error: "Failed to delete idea" });
    }
  });

  return httpServer;
}
