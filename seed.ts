import { db } from "./db";
import { ideas } from "./shared/schema";

const SEED_DATA = [
  { title: "Future Tech", description: "Emerging technologies reshaping humanity.", type: "topic", color: "#ef4444", parentId: null },
  { title: "AGI Research", description: "Latest papers on Artificial General Intelligence.", type: "text", color: "#ef4444", parentId: null },
  { title: "Space Exp.", description: "Humanity's journey to the stars.", type: "topic", color: "#3b82f6", parentId: null },
];

async function seed() {
  console.log("Seeding database...");
  
  for (const idea of SEED_DATA) {
    await db.insert(ideas).values(idea);
  }
  
  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
