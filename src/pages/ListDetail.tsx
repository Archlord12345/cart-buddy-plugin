import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getList, addItem, toggleItem, removeItem, ShoppingList } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Trash2, ShoppingCart } from "lucide-react";

export default function ListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<ShoppingList | undefined>();
  const [newItem, setNewItem] = useState("");

  const refresh = () => setList(id ? getList(id) : undefined);

  useEffect(() => {
    refresh();
  }, [id]);

  if (!list) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Liste introuvable</p>
      </div>
    );
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim() && id) {
      addItem(id, newItem.trim());
      setNewItem("");
      refresh();
    }
  };

  const handleToggle = (itemId: string) => {
    if (id) {
      toggleItem(id, itemId);
      refresh();
    }
  };

  const handleRemove = (itemId: string) => {
    if (id) {
      removeItem(id, itemId);
      refresh();
    }
  };

  const unchecked = list.items.filter((i) => !i.checked);
  const checked = list.items.filter((i) => i.checked);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl">{list.emoji}</span>
            <h1 className="text-2xl font-serif font-semibold truncate">{list.name}</h1>
          </div>
        </div>

        {/* Add item form */}
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

        {/* Items */}
        {list.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-lg font-medium">Liste vide</p>
            <p className="text-sm">Ajoutez votre premier article ci-dessus</p>
          </div>
        ) : (
          <div className="space-y-1">
            {unchecked.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
              >
                <Checkbox
                  checked={false}
                  onCheckedChange={() => handleToggle(item.id)}
                  className="h-5 w-5"
                />
                <span className="flex-1 text-sm">{item.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                  onClick={() => handleRemove(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
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
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group opacity-60"
                  >
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => handleToggle(item.id)}
                      className="h-5 w-5"
                    />
                    <span className="flex-1 text-sm line-through">{item.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
