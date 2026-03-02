import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchLists, createList, deleteList, duplicateList, type ShoppingList } from "@/lib/store";
import { CreateListDialog } from "@/components/CreateListDialog";
import { ListCard } from "@/components/ListCard";
import { UserMenu } from "@/components/UserMenu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ShoppingBasket, Search, BarChart3 } from "lucide-react";
import { toast } from "sonner";

type SortOption = "recent" | "oldest" | "name" | "items";

export default function Index() {
  const { user } = useAuth();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [sort, setSort] = useState<SortOption>("recent");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await fetchLists();
      setLists(data);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleCreate = async (name: string) => {
    if (!user) return;
    try {
      await createList(user.id, name);
      refresh();
      toast.success("Liste créée !");
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteList(id);
      refresh();
      toast.success("Liste supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDuplicate = async (list: ShoppingList) => {
    if (!user) return;
    try {
      await duplicateList(user.id, list);
      refresh();
      toast.success("Liste dupliquée !");
    } catch {
      toast.error("Erreur lors de la duplication");
    }
  };

  const filtered = useMemo(() => {
    let result = [...lists];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) => l.name.toLowerCase().includes(q));
    }
    switch (sort) {
      case "recent": return result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      case "oldest": return result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "name": return result.sort((a, b) => a.name.localeCompare(b.name));
      case "items": return result.sort((a, b) => b.shopping_items.length - a.shopping_items.length);
      default: return result;
    }
  }, [lists, sort, search]);

  // Stats
  const totalItems = lists.reduce((sum, l) => sum + l.shopping_items.length, 0);
  const checkedItems = lists.reduce((sum, l) => sum + l.shopping_items.filter((i) => i.checked).length, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <ShoppingBasket className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-serif font-bold">Mes Courses</h1>
          </div>
          <UserMenu />
        </div>
        <p className="text-muted-foreground mb-6">
          Gérez vos listes de courses facilement
        </p>

        {/* Stats */}
        {lists.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="glass-card rounded-xl p-3 text-center">
              <p className="text-2xl font-serif font-bold text-primary">{lists.length}</p>
              <p className="text-xs text-muted-foreground">Liste{lists.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="glass-card rounded-xl p-3 text-center">
              <p className="text-2xl font-serif font-bold text-accent">{totalItems}</p>
              <p className="text-xs text-muted-foreground">Article{totalItems !== 1 ? "s" : ""}</p>
            </div>
            <div className="glass-card rounded-xl p-3 text-center">
              <p className="text-2xl font-serif font-bold text-success">{checkedItems}</p>
              <p className="text-xs text-muted-foreground">Complété{checkedItems !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}

        {/* Search + Sort toolbar */}
        <div className="flex items-center gap-3 mb-6">
          <CreateListDialog onCreateList={handleCreate} />
          <div className="flex-1" />
          {lists.length > 1 && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-40 rounded-xl"
                />
              </div>
              <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="w-40 rounded-xl">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  <SelectValue placeholder="Trier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Plus récent</SelectItem>
                  <SelectItem value="oldest">Plus ancien</SelectItem>
                  <SelectItem value="name">Nom A-Z</SelectItem>
                  <SelectItem value="items">Nb d'articles</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        {/* Lists */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-pulse text-muted-foreground">Chargement...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ShoppingBasket className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">{search ? "Aucun résultat" : "Aucune liste"}</p>
            <p className="text-sm">{search ? "Essayez un autre terme" : "Créez votre première liste de courses !"}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((list) => (
              <ListCard key={list.id} list={list} onDelete={handleDelete} onDuplicate={handleDuplicate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
