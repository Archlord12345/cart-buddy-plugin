import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchList, addItem, toggleItem, removeItem, clearCheckedItems,
  updateListName, updateItemQuantity, getListPermission, type ShoppingList
} from "@/lib/store";
import { ShareListDialog } from "@/components/ShareListDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, ShoppingCart, CheckCheck, Pencil, Minus } from "lucide-react";
import { toast } from "sonner";

export default function ListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [listName, setListName] = useState("");
  const [permission, setPermission] = useState<"owner" | "edit" | "view" | null>(null);

  const refresh = useCallback(async () => {
    if (!id || !user) return;
    try {
      const data = await fetchList(id);
      setList(data);
      if (data) setListName(data.name);
      const perm = await getListPermission(user.id, id);
      setPermission(perm);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Liste introuvable</p>
        <Button variant="ghost" onClick={() => navigate("/")}>Retour</Button>
      </div>
    );
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim() && id && user) {
      await addItem(id, user.id, newItem.trim());
      setNewItem("");
      refresh();
    }
  };

  const handleToggle = async (itemId: string) => {
    await toggleItem(itemId);
    refresh();
  };

  const handleRemove = async (itemId: string) => {
    await removeItem(itemId);
    refresh();
  };

  const handleClearChecked = async () => {
    if (id) {
      await clearCheckedItems(id);
      refresh();
      toast.success("Articles complétés supprimés");
    }
  };

  const handleSaveName = async () => {
    if (id && listName.trim()) {
      await updateListName(id, listName.trim());
      setEditingName(false);
      refresh();
    }
  };

  const handleQuantityChange = async (itemId: string, delta: number, currentQty: number) => {
    const newQty = Math.max(1, currentQty + delta);
    await updateItemQuantity(itemId, newQty);
    refresh();
  };

  const canEdit = permission === "owner" || permission === "edit";
  const isOwner = permission === "owner";
  const unchecked = list.shopping_items.filter((i) => !i.checked);
  const checked = list.shopping_items.filter((i) => i.checked);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-2xl">{list.emoji}</span>
          {editingName && isOwner ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveName(); }} className="flex gap-2 flex-1">
              <Input value={listName} onChange={(e) => setListName(e.target.value)} autoFocus className="flex-1 rounded-xl" />
              <Button type="submit" size="sm">OK</Button>
            </form>
          ) : (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h1 className="text-2xl font-serif font-semibold truncate">{list.name}</h1>
              {isOwner && (
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => setEditingName(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {!isOwner && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {permission === "edit" ? "Édition" : "Lecture"}
                </Badge>
              )}
            </div>
          )}
          {isOwner && <ShareListDialog listId={list.id} listName={list.name} />}
        </div>

        {/* Stats bar */}
        {list.shopping_items.length > 0 && (
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-sm text-muted-foreground">
              {checked.length}/{list.shopping_items.length} complété{checked.length !== 1 ? "s" : ""}
            </p>
            {checked.length > 0 && canEdit && (
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={handleClearChecked}>
                <CheckCheck className="h-3.5 w-3.5" />
                Supprimer complétés
              </Button>
            )}
          </div>
        )}

        {/* Add item form - only for edit/owner */}
        {canEdit && (
          <form onSubmit={handleAddItem} className="flex gap-2 mb-6">
            <Input
              placeholder="Ajouter un article..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="flex-1 rounded-xl"
            />
            <Button type="submit" disabled={!newItem.trim()} size="icon" className="rounded-xl flex-shrink-0">
              <Plus className="h-5 w-5" />
            </Button>
          </form>
        )}

        {/* Items */}
        {list.shopping_items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-lg font-medium">Liste vide</p>
            <p className="text-sm">Ajoutez votre premier article ci-dessus</p>
          </div>
        ) : (
          <div className="space-y-1">
            {unchecked.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                <Checkbox checked={false} onCheckedChange={() => canEdit && handleToggle(item.id)} className="h-5 w-5" disabled={!canEdit} />
                <span className="flex-1 text-sm">{item.name}</span>
                {canEdit && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(item.id, -1, item.quantity)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-xs w-5 text-center font-medium">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(item.id, 1, item.quantity)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {!canEdit && <span className="text-xs text-muted-foreground">×{item.quantity}</span>}
                {canEdit && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => handleRemove(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}

            {checked.length > 0 && (
              <>
                <div className="pt-4 pb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Complétés ({checked.length})
                  </p>
                </div>
                {checked.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group opacity-60">
                    <Checkbox checked={true} onCheckedChange={() => canEdit && handleToggle(item.id)} className="h-5 w-5" disabled={!canEdit} />
                    <span className="flex-1 text-sm line-through">{item.name}</span>
                    {canEdit && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => handleRemove(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
