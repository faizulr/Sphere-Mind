import { db } from "@db";
import { ideas, type InsertIdea, type Idea } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

export interface IStorage {
  getAllIdeas(): Promise<Idea[]>;
  getIdea(id: string): Promise<Idea | undefined>;
  createIdea(idea: InsertIdea): Promise<Idea>;
  updateIdea(id: string, idea: Partial<InsertIdea>): Promise<Idea | undefined>;
  deleteIdea(id: string): Promise<void>;
  deleteIdeasByParent(parentId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAllIdeas(): Promise<Idea[]> {
    return await db.select().from(ideas);
  }

  async getIdea(id: string): Promise<Idea | undefined> {
    const result = await db.select().from(ideas).where(eq(ideas.id, id));
    return result[0];
  }

  async createIdea(insertIdea: InsertIdea): Promise<Idea> {
    const result = await db.insert(ideas).values(insertIdea).returning();
    return result[0];
  }

  async updateIdea(id: string, updateData: Partial<InsertIdea>): Promise<Idea | undefined> {
    const result = await db.update(ideas)
      .set(updateData)
      .where(eq(ideas.id, id))
      .returning();
    return result[0];
  }

  async deleteIdea(id: string): Promise<void> {
    await db.delete(ideas).where(eq(ideas.id, id));
  }

  async deleteIdeasByParent(parentId: string): Promise<void> {
    await db.delete(ideas).where(eq(ideas.parentId, parentId));
  }
}

export const storage = new DatabaseStorage();
