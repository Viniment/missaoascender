import { useState, useRef, useEffect } from 'react';
import { useGame } from '@/lib/GameContext';
import type { VisionCategory, VisionItem } from '@/lib/gameStore';
import { getTodayBrasilia } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Pencil, Image, Type, Layers, Play, X, ChevronLeft,
  ArrowLeft, ArrowRight, Flame, FolderPlus, Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

const DEFAULT_ICONS = ['💰', '🏋️', '❤️', '🧠', '✨', '🏠', '🚗', '✈️', '📚', '🎯', '🔥', '🌟'];

export default function VisualizarPanel() {
  const { state, setState } = useGame();
  const categories = state.visionCategories || [];
  const items = state.visionItems || [];

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<VisionCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('🎯');

  const [showItemDialog, setShowItemDialog] = useState(false);
  const [itemType, setItemType] = useState<'image' | 'text' | 'card'>('image');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemText, setItemText] = useState('');
  const [editingItem, setEditingItem] = useState<VisionItem | null>(null);

  const [focusItem, setFocusItem] = useState<VisionItem | null>(null);
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [immersiveIndex, setImmersiveIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vision streak
  const visionStreak = state.visionStreak || 0;
  const lastViewed = state.visionLastViewedDate;

  const trackView = () => {
    const today = getTodayBrasilia();
    if (lastViewed === today) return;

    let newStreak = 1;
    if (lastViewed) {
      const lastDate = new Date(lastViewed);
      const todayDate = new Date(today);
      const diff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) newStreak = visionStreak + 1;
      else if (diff === 0) return;
    }

    setState(prev => ({
      ...prev,
      visionStreak: newStreak,
      visionLastViewedDate: today,
    }));
  };

  // Category CRUD
  const saveCategory = () => {
    if (!catName.trim()) return;
    setState(prev => {
      if (editingCategory) {
        return {
          ...prev,
          visionCategories: (prev.visionCategories || []).map(c =>
            c.id === editingCategory.id ? { ...c, name: catName.trim(), icon: catIcon } : c
          ),
        };
      }
      const newCat: VisionCategory = {
        id: crypto.randomUUID(),
        name: catName.trim(),
        icon: catIcon,
        order: (prev.visionCategories || []).length,
      };
      return { ...prev, visionCategories: [...(prev.visionCategories || []), newCat] };
    });
    setShowCategoryDialog(false);
    setEditingCategory(null);
    setCatName('');
    setCatIcon('🎯');
    toast.success(editingCategory ? 'Categoria atualizada!' : 'Categoria criada!');
  };

  const deleteCategory = (id: string) => {
    setState(prev => ({
      ...prev,
      visionCategories: (prev.visionCategories || []).filter(c => c.id !== id),
      visionItems: (prev.visionItems || []).filter(i => i.categoryId !== id),
    }));
    if (selectedCategory === id) setSelectedCategory(null);
    toast.success('Categoria excluída!');
  };

  // Item CRUD
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setItemImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveItem = () => {
    if (!selectedCategory) return;
    if (itemType === 'image' && !itemImageUrl) {
      toast.error('Adicione uma imagem.');
      return;
    }
    if (itemType === 'text' && !itemText.trim()) {
      toast.error('Adicione um texto.');
      return;
    }
    if (itemType === 'card' && !itemImageUrl && !itemText.trim()) {
      toast.error('Adicione imagem e/ou texto.');
      return;
    }

    setState(prev => {
      if (editingItem) {
        return {
          ...prev,
          visionItems: (prev.visionItems || []).map(i =>
            i.id === editingItem.id
              ? { ...i, type: itemType, imageUrl: itemImageUrl || undefined, text: itemText || undefined }
              : i
          ),
        };
      }
      const newItem: VisionItem = {
        id: crypto.randomUUID(),
        categoryId: selectedCategory,
        type: itemType,
        imageUrl: itemImageUrl || undefined,
        text: itemText || undefined,
        order: (prev.visionItems || []).filter(i => i.categoryId === selectedCategory).length,
        createdAt: new Date().toISOString(),
      };
      return { ...prev, visionItems: [...(prev.visionItems || []), newItem] };
    });

    setShowItemDialog(false);
    resetItemForm();
    toast.success(editingItem ? 'Item atualizado!' : 'Item adicionado!');
  };

  const deleteItem = (id: string) => {
    setState(prev => ({
      ...prev,
      visionItems: (prev.visionItems || []).filter(i => i.id !== id),
    }));
    toast.success('Item removido!');
  };

  const resetItemForm = () => {
    setItemType('image');
    setItemImageUrl('');
    setItemText('');
    setEditingItem(null);
  };

  const openEditItem = (item: VisionItem) => {
    setEditingItem(item);
    setItemType(item.type);
    setItemImageUrl(item.imageUrl || '');
    setItemText(item.text || '');
    setShowItemDialog(true);
  };

  // Immersive mode
  const categoryItems = selectedCategory
    ? items.filter(i => i.categoryId === selectedCategory)
    : items;

  const allImmersiveItems = items.filter(i => i.imageUrl || i.text);

  const startImmersive = () => {
    if (allImmersiveItems.length === 0) {
      toast.error('Adicione itens ao seu board primeiro.');
      return;
    }
    setImmersiveIndex(0);
    setImmersiveMode(true);
    trackView();
  };

  useEffect(() => {
    if (!immersiveMode) return;
    const timer = setInterval(() => {
      setImmersiveIndex(prev => (prev + 1) % allImmersiveItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [immersiveMode, allImmersiveItems.length]);

  const currentCat = categories.find(c => c.id === selectedCategory);
  const currentItems = selectedCategory
    ? items.filter(i => i.categoryId === selectedCategory).sort((a, b) => a.order - b.order)
    : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-primary glow-text-purple flex items-center gap-2">
          <Layers className="w-5 h-5" /> VISUALIZAR
        </h2>
        <div className="flex items-center gap-2">
          {visionStreak > 0 && (
            <span className="flex items-center gap-1 text-xs font-body text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5" /> {visionStreak} dias seguidos
            </span>
          )}
          <Button size="sm" variant="outline" onClick={startImmersive} className="border-primary/30 text-primary text-xs">
            <Play className="w-3.5 h-3.5 mr-1" /> Imersão
          </Button>
        </div>
      </div>

      {/* Category view or list */}
      {!selectedCategory ? (
        <>
          {/* Categories grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.sort((a, b) => a.order - b.order).map(cat => {
              const catItemCount = items.filter(i => i.categoryId === cat.id).length;
              const preview = items.find(i => i.categoryId === cat.id && i.imageUrl);
              return (
                <motion.div
                  key={cat.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rpg-panel cursor-pointer group relative overflow-hidden"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {preview?.imageUrl && (
                    <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                      <img src={preview.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="relative z-10 flex flex-col items-center gap-2 py-4">
                    <span className="text-3xl">{cat.icon}</span>
                    <span className="font-display text-sm text-foreground">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">{catItemCount} itens</span>
                  </div>
                  {/* Actions */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setCatName(cat.name); setCatIcon(cat.icon); setShowCategoryDialog(true); }}
                      className="p-1 rounded bg-background/80 text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}
                      className="p-1 rounded bg-background/80 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {/* Add category */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rpg-panel cursor-pointer border-dashed border-border/50 flex flex-col items-center justify-center gap-2 py-6"
              onClick={() => { setEditingCategory(null); setCatName(''); setCatIcon('🎯'); setShowCategoryDialog(true); }}
            >
              <FolderPlus className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Nova Categoria</span>
            </motion.div>
          </div>
        </>
      ) : (
        <>
          {/* Category detail view */}
          <div className="flex items-center gap-2 mb-2">
            <Button size="sm" variant="ghost" onClick={() => setSelectedCategory(null)} className="text-muted-foreground">
              <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
            <span className="text-lg">{currentCat?.icon}</span>
            <h3 className="font-display text-sm text-foreground">{currentCat?.name}</h3>
            <div className="ml-auto">
              <Button
                size="sm"
                onClick={() => { resetItemForm(); setShowItemDialog(true); }}
                className="bg-primary/20 text-primary hover:bg-primary/30 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
              </Button>
            </div>
          </div>

          {/* Items grid (Pinterest-style) */}
          {currentItems.length === 0 ? (
            <div className="rpg-panel text-center py-12">
              <Image className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum item ainda.</p>
              <p className="text-xs text-muted-foreground mt-1">Adicione imagens e textos dos seus objetivos.</p>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 gap-3 space-y-3">
              {currentItems.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="break-inside-avoid rpg-panel p-0 overflow-hidden group relative cursor-pointer"
                  onClick={() => setFocusItem(item)}
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.text || ''}
                      className="w-full object-cover"
                      loading="lazy"
                    />
                  )}
                  {item.text && (
                    <div className={`p-3 ${item.imageUrl ? 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent' : ''}`}>
                      <p className={`text-sm font-body ${item.imageUrl ? 'text-white' : 'text-foreground'}`}>
                        {item.text}
                      </p>
                    </div>
                  )}
                  {/* Item actions */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditItem(item); }}
                      className="p-1 rounded bg-background/80 text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                      className="p-1 rounded bg-background/80 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Nome</label>
              <Input
                value={catName}
                onChange={e => setCatName(e.target.value)}
                placeholder="Ex: Riqueza, Corpo, Mentalidade..."
                className="bg-secondary border-border"
                maxLength={30}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Ícone</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {DEFAULT_ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setCatIcon(icon)}
                    className={`text-xl p-1.5 rounded-md transition-colors ${
                      catIcon === icon ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-secondary'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveCategory} disabled={!catName.trim()} className="bg-primary text-primary-foreground">
              {editingCategory ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={(open) => { setShowItemDialog(open); if (!open) resetItemForm(); }}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Type selector */}
            <div>
              <label className="text-xs text-muted-foreground">Tipo</label>
              <div className="flex gap-2 mt-1">
                {([
                  { value: 'image' as const, icon: Image, label: 'Imagem' },
                  { value: 'text' as const, icon: Type, label: 'Texto' },
                  { value: 'card' as const, icon: Layers, label: 'Card' },
                ]).map(t => (
                  <button
                    key={t.value}
                    onClick={() => setItemType(t.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-body transition-colors ${
                      itemType === t.value
                        ? 'bg-primary/20 text-primary ring-1 ring-primary/50'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Image input */}
            {(itemType === 'image' || itemType === 'card') && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Imagem</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs"
                  >
                    <Image className="w-3.5 h-3.5 mr-1" /> Upload
                  </Button>
                  <Input
                    value={itemImageUrl.startsWith('data:') ? '' : itemImageUrl}
                    onChange={e => setItemImageUrl(e.target.value)}
                    placeholder="Ou cole URL da imagem..."
                    className="bg-secondary border-border text-xs flex-1"
                  />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                {itemImageUrl && (
                  <div className="rounded-md overflow-hidden border border-border max-h-48">
                    <img src={itemImageUrl} alt="Preview" className="w-full object-contain max-h-48" />
                  </div>
                )}
              </div>
            )}

            {/* Text input */}
            {(itemType === 'text' || itemType === 'card') && (
              <div>
                <label className="text-xs text-muted-foreground">Texto / Afirmação</label>
                <Textarea
                  value={itemText}
                  onChange={e => setItemText(e.target.value)}
                  placeholder="Ex: Eu sou próspero e abundante..."
                  className="bg-secondary border-border min-h-[80px]"
                  maxLength={500}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={saveItem} className="bg-primary text-primary-foreground">
              {editingItem ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Focus mode (single item fullscreen) */}
      <AnimatePresence>
        {focusItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setFocusItem(null)}
          >
            <button className="absolute top-4 right-4 text-white/60 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="max-w-3xl max-h-[85vh] flex flex-col items-center gap-4"
              onClick={e => e.stopPropagation()}
            >
              {focusItem.imageUrl && (
                <img src={focusItem.imageUrl} alt="" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
              )}
              {focusItem.text && (
                <p className="text-white text-lg font-body text-center max-w-lg">{focusItem.text}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Immersive slideshow mode */}
      <AnimatePresence>
        {immersiveMode && allImmersiveItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            <button
              className="absolute top-4 right-4 text-white/60 hover:text-white z-10"
              onClick={() => setImmersiveMode(false)}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation */}
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white z-10"
              onClick={() => setImmersiveIndex(prev => (prev - 1 + allImmersiveItems.length) % allImmersiveItems.length)}
            >
              <ArrowLeft className="w-8 h-8" />
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white z-10"
              onClick={() => setImmersiveIndex(prev => (prev + 1) % allImmersiveItems.length)}
            >
              <ArrowRight className="w-8 h-8" />
            </button>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={immersiveIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="flex flex-col items-center gap-6 max-w-4xl px-8"
              >
                {allImmersiveItems[immersiveIndex]?.imageUrl && (
                  <img
                    src={allImmersiveItems[immersiveIndex].imageUrl}
                    alt=""
                    className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
                  />
                )}
                {allImmersiveItems[immersiveIndex]?.text && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-white text-xl md:text-2xl font-body text-center max-w-2xl leading-relaxed"
                  >
                    {allImmersiveItems[immersiveIndex].text}
                  </motion.p>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImmersiveItems.slice(0, 20).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === immersiveIndex ? 'bg-primary' : 'bg-white/20'
                  }`}
                />
              ))}
              {allImmersiveItems.length > 20 && (
                <span className="text-xs text-white/40 ml-1">+{allImmersiveItems.length - 20}</span>
              )}
            </div>

            {/* Counter */}
            <div className="absolute bottom-6 right-6 text-white/40 text-xs font-body">
              {immersiveIndex + 1} / {allImmersiveItems.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
