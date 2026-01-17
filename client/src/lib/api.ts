import { Idea } from "@/components/IdeaSphere";

const API_BASE = "/api";

export interface ApiIdea {
  id: string;
  title: string;
  description: string;
  type: string;
  mediaUrl?: string | null;
  parentId?: string | null;
  color?: string | null;
  positionX?: string | null;
  positionY?: string | null;
  positionZ?: string | null;
  createdAt: string;
}

function apiIdeaToIdea(apiIdea: ApiIdea): Idea {
  return {
    id: apiIdea.id,
    title: apiIdea.title,
    description: apiIdea.description,
    type: apiIdea.type as any,
    mediaUrl: apiIdea.mediaUrl || undefined,
    parentId: apiIdea.parentId && apiIdea.parentId !== "" ? apiIdea.parentId : undefined,
    color: apiIdea.color || undefined,
    position: apiIdea.positionX && apiIdea.positionY && apiIdea.positionZ
      ? [parseFloat(apiIdea.positionX), parseFloat(apiIdea.positionY), parseFloat(apiIdea.positionZ)] as [number, number, number]
      : undefined,
  };
}

function ideaToApiIdea(idea: Partial<Idea>): Partial<ApiIdea> {
  return {
    title: idea.title,
    description: idea.description,
    type: idea.type,
    mediaUrl: idea.mediaUrl || null,
    parentId: idea.parentId || null,
    color: idea.color || null,
    positionX: idea.position ? String(idea.position[0]) : null,
    positionY: idea.position ? String(idea.position[1]) : null,
    positionZ: idea.position ? String(idea.position[2]) : null,
  };
}

export async function fetchIdeas(): Promise<Idea[]> {
  const response = await fetch(`${API_BASE}/ideas`);
  if (!response.ok) throw new Error("Failed to fetch ideas");
  const data: ApiIdea[] = await response.json();
  return data.map(apiIdeaToIdea);
}

export async function createIdea(idea: Omit<Idea, "id">): Promise<Idea> {
  const response = await fetch(`${API_BASE}/ideas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ideaToApiIdea(idea)),
  });
  if (!response.ok) throw new Error("Failed to create idea");
  const data: ApiIdea = await response.json();
  return apiIdeaToIdea(data);
}

export async function updateIdea(id: string, updates: Partial<Idea>): Promise<Idea> {
  const response = await fetch(`${API_BASE}/ideas/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ideaToApiIdea(updates)),
  });
  if (!response.ok) throw new Error("Failed to update idea");
  const data: ApiIdea = await response.json();
  return apiIdeaToIdea(data);
}

export async function deleteIdea(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/ideas/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete idea");
}
