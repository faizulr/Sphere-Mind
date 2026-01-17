import React, { useState, useEffect, useCallback } from "react";
import { IdeaSphere, Idea, MediaType } from "@/components/IdeaSphere";
import { BlurCard } from "@/components/ui/blur-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Share2, Maximize2, Info, ChevronRight, X, 
  Video, Mic, FileText, Globe, Link as LinkIcon, Music, Play
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import bgImage from "@assets/generated_images/deep_space_background_with_subtle_nebula.png";
import * as api from "@/lib/api";

export default function Home() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<MediaType>('text');
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [creationMode, setCreationMode] = useState<'child' | 'root'>('child');

  // Fetch ideas from API
  const { data: ideas = [], isLoading } = useQuery({
    queryKey: ["ideas"],
    queryFn: api.fetchIdeas,
  });

  // Create idea mutation
  const createMutation = useMutation({
    mutationFn: api.createIdea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });

  // Update idea mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Idea> }) =>
      api.updateIdea(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });

  // Delete idea mutation
  const deleteMutation = useMutation({
    mutationFn: api.deleteIdea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });

  const selectedIdea = ideas.find(i => i.id === selectedId);

  // Update creation mode when selection changes
  useEffect(() => {
    if (selectedId) {
      setCreationMode('child');
    } else {
      setCreationMode('root');
    }
  }, [selectedId]);

  const handleAddIdea = async () => {
    if (!newTitle.trim()) return;
    
    let parentId: string | null = null;
    let color = "#a855f7";

    if (creationMode === 'root') {
       // Create independent node (usually a topic, but can be anything)
       parentId = null;
       color = `hsl(${Math.random() * 360}, 70%, 60%)`;
    } else {
       // Create child node
       if (selectedId) {
          parentId = selectedId;
          // Inherit color from parent tree
          const parent = ideas.find(i => i.id === selectedId);
          color = parent?.color || "#a855f7";
       } else {
          // Fallback if nothing selected but mode is child (shouldn't happen with UI guards)
          setCreationMode('root');
          parentId = null;
       }
    }

    const newIdea = {
      title: newTitle,
      description: newDesc,
      type: newType,
      mediaUrl: newMediaUrl || undefined,
      parentId: parentId,
      color: color,
      // If it's a root topic, give it a random position initially to avoid overlap at 0,0,0
      position: !parentId ? [
        (Math.random() - 0.5) * 20, 
        (Math.random() - 0.5) * 20, 
        (Math.random() - 0.5) * 20
      ] as [number, number, number] : undefined
    };
    
    const created = await createMutation.mutateAsync(newIdea);
    setNewTitle("");
    setNewDesc("");
    setNewMediaUrl("");
    setNewType('text');
    
    // Select the new idea so we can see it or add children to IT
    if (creationMode === 'root') {
       setSelectedId(created.id);
    }
  };

  const handleNodeMove = useCallback((id: string, pos: [number, number, number]) => {
    updateMutation.mutate({ id, updates: { position: pos } });
  }, [updateMutation]);

  const getTypeIcon = (type: MediaType) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Mic className="w-4 h-4" />;
      case 'topic': return <Globe className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleDeleteIdea = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    setSelectedId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="text-2xl mb-2">Loading NEXUS...</div>
          <div className="text-sm text-purple-300">Initializing knowledge graph</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white font-sans selection:bg-purple-500/30">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-50"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* 3D Sphere Layer */}
      <div className="absolute inset-0 z-10">
        <IdeaSphere 
          ideas={ideas} 
          onSelectIdea={setSelectedId} 
          selectedId={selectedId}
          onNodeMove={handleNodeMove}
        />
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Header */}
        <header className="flex justify-between items-start pointer-events-auto">
          <div className="flex flex-col gap-1">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-purple-400"
            >
              NEXUS
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4 text-xs text-purple-300/60 font-mono uppercase tracking-widest"
            >
              <span>{ideas.filter(i => i.type === 'topic').length} Topics</span>
              <span>•</span>
              <span>{ideas.length} Total Nodes</span>
            </motion.div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="bg-black/20 backdrop-blur border-white/10 hover:bg-white/10 rounded-full">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="bg-black/20 backdrop-blur border-white/10 hover:bg-white/10 rounded-full">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 pointer-events-none" />

        {/* Footer / Controls */}
        <div className="flex justify-between items-end pointer-events-auto gap-6">
          
          {/* Left: Selected Idea Details */}
          <div className="w-full max-w-md pointer-events-none">
            <AnimatePresence mode="wait">
              {selectedIdea ? (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: -50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, scale: 0.9 }}
                  transition={{ type: "spring", bounce: 0.2 }}
                  className="pointer-events-auto"
                >
                  <BlurCard className="overflow-hidden border-l-4" style={{ borderLeftColor: selectedIdea.color }}>
                    {/* Header */}
                    <div className="p-6 pb-2 flex justify-between items-start">
                      <div className="flex items-center gap-3">
                         <div className="p-2 rounded-md bg-white/5 border border-white/10 text-purple-300">
                            {getTypeIcon(selectedIdea.type)}
                         </div>
                         <div>
                            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-0.5">
                              {selectedIdea.type} Node
                            </div>
                            <h2 className="text-xl font-bold text-white leading-none">{selectedIdea.title}</h2>
                         </div>
                      </div>
                      <Button 
                        variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:text-white -mr-2 -mt-2"
                        onClick={() => setSelectedId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 space-y-4">
                      <p className="text-white/70 text-sm leading-relaxed">
                        {selectedIdea.description || "No description provided."}
                      </p>

                      {selectedIdea.type === 'video' && selectedIdea.mediaUrl && (
                        <div className="rounded-lg overflow-hidden border border-white/10 bg-black/50 aspect-video flex items-center justify-center group cursor-pointer">
                           <video 
                              src={selectedIdea.mediaUrl} 
                              controls 
                              className="w-full h-full object-cover"
                           />
                        </div>
                      )}

                      {selectedIdea.type === 'audio' && selectedIdea.mediaUrl && (
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3">
                           <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">
                             <Music className="w-4 h-4" />
                           </div>
                           <div className="flex-1 h-8 flex items-center">
                             <audio controls src={selectedIdea.mediaUrl} className="w-full h-8 opacity-80 scale-y-90 origin-left" />
                           </div>
                        </div>
                      )}
                      
                      {selectedIdea.type === 'topic' && (
                        <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-500/20">
                           <p className="text-xs text-purple-200">
                             Center Point • {ideas.filter(i => i.parentId === selectedIdea.id).length} Connected Nodes
                           </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="p-4 bg-black/20 border-t border-white/5 flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md"
                        onClick={() => setIsAdding(true)}
                      >
                        Add Child Node
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/30 backdrop-blur-md"
                        onClick={() => handleDeleteIdea(selectedIdea.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </BlurCard>
                </motion.div>
              ) : (
                <motion.div
                  key="instruction"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 max-w-[300px] bg-gradient-to-r from-black/40 to-transparent rounded-lg border-l-2 border-purple-500/30 backdrop-blur-sm"
                >
                  <p className="text-white/50 text-xs font-mono">
                    <span className="text-purple-400 font-bold">&gt; SYSTEM READY</span><br/>
                    Select a node to inspect data.<br/>
                    Use [+] to inject new entities.
                    <br/>Drag nodes to rearrange.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Add New Idea FAB & Form */}
          <div className="flex flex-col items-end gap-4 pointer-events-auto">
            <AnimatePresence>
              {isAdding && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="mb-4"
                >
                  <BlurCard className="w-80 p-0 overflow-hidden shadow-2xl ring-1 ring-white/10">
                    <div className="flex border-b border-white/10">
                       <button
                          onClick={() => setCreationMode('child')}
                          disabled={!selectedId}
                          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors
                             ${creationMode === 'child' 
                               ? 'bg-purple-500/20 text-purple-300' 
                               : 'bg-transparent text-white/40 hover:text-white/60'
                             }
                             ${!selectedId ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                       >
                          Add Child
                       </button>
                       <div className="w-px bg-white/10" />
                       <button
                          onClick={() => setCreationMode('root')}
                          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors
                             ${creationMode === 'root' 
                               ? 'bg-purple-500/20 text-purple-300' 
                               : 'bg-transparent text-white/40 hover:text-white/60'
                             }
                          `}
                       >
                          New Topic
                       </button>
                    </div>
                    
                    {creationMode === 'child' && selectedId && (
                       <div className="px-4 py-2 bg-purple-500/10 border-b border-white/5 text-[10px] text-purple-200 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          Attaching to: <span className="font-bold">{ideas.find(i => i.id === selectedId)?.title}</span>
                       </div>
                    )}
                    
                    <div className="p-4 space-y-4">
                      {/* Type Selector */}
                      <div className="grid grid-cols-4 gap-1 bg-black/20 p-1 rounded-lg">
                         {(['text', 'video', 'audio', 'topic'] as const).map((t) => (
                           <button
                             key={t}
                             onClick={() => setNewType(t)}
                             className={`
                               flex flex-col items-center justify-center gap-1 py-2 rounded-md text-[10px] uppercase font-medium transition-all
                               ${newType === t ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}
                             `}
                           >
                             {getTypeIcon(t)}
                             {t}
                           </button>
                         ))}
                      </div>

                      <div className="space-y-3">
                        <Input 
                          placeholder="Entity Title" 
                          className="bg-black/30 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500/50"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          autoFocus
                        />
                        
                        <Textarea 
                          placeholder="Description / Context..." 
                          className="bg-black/30 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500/50 h-20 resize-none text-xs"
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                        />

                        {(newType === 'video' || newType === 'audio') && (
                           <div className="relative">
                              <LinkIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/40" />
                              <Input 
                                placeholder={`Paste ${newType} URL...`} 
                                className="pl-9 bg-black/30 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500/50 text-xs"
                                value={newMediaUrl}
                                onChange={(e) => setNewMediaUrl(e.target.value)}
                              />
                           </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsAdding(false)}
                          className="text-white/50 hover:text-white h-8"
                        >
                          Done
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleAddIdea}
                          disabled={!newTitle.trim()}
                          className="bg-purple-600 hover:bg-purple-500 text-white border-none h-8"
                        >
                          {creationMode === 'child' ? 'Add Child Node' : 'Create Topic'}
                        </Button>
                      </div>
                    </div>
                  </BlurCard>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                onClick={() => setIsAdding(!isAdding)}
                className={`
                  h-14 w-14 rounded-full shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 border border-white/20
                  ${isAdding ? "bg-red-500/80 hover:bg-red-600 rotate-45 backdrop-blur-md" : "bg-purple-600/80 hover:bg-purple-500 backdrop-blur-md"}
                `}
              >
                <Plus className="w-6 h-6 text-white" />
              </Button>
            </motion.div>
          </div>
          
        </div>
      </div>
    </div>
  );
}