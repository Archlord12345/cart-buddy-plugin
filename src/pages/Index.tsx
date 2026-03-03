import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchLists, fetchSharedLists, createList, deleteList, duplicateList, type ShoppingList } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { CreateListDialog } from "@/components/CreateListDialog";
import { ListCard } from "@/components/ListCard";
import { UserMenu } from "@/components/UserMenu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ShoppingBasket, Search, BarChart3, Share2 } from "lucide-react";
import { toast } from "sonner";

type SortOption = "recent" | "oldest" | "name" | "items";

export default function Index() {
  const { user } = useAuth();
  const [allLists, setAllLists] = useState<ShoppingList[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortOption>("recent");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await fetchLists();
      setAllLists(data);
      // Fetch profile display names for all unique user_ids
      const userIds = [...new Set(data.map(l => l.user_id))];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        if (profilesData) {
          const map: Record<string, string> = {};
          profilesData.forEach(p => { map[p.user_id] = p.display_name || "Utilisateur"; });
          setProfiles(map);
        }
      }
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

  const myLists = allLists.filter(l => l.user_id === user?.id);
  const otherLists = allLists.filter(l => l.user_id !== user?.id);

  const applySort = (lists: ShoppingList[]) => {
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
  };

  const filteredMine = useMemo(() => applySort(myLists), [myLists, sort, search]);
  const filteredOthers = useMemo(() => applySort(otherLists), [otherLists, sort, search]);

  // Stats
  const totalItems = allLists.reduce((sum, l) => sum + l.shopping_items.length, 0);
  const checkedItems = allLists.reduce((sum, l) => sum + l.shopping_items.filter((i) => i.checked).length, 0);

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
        {allLists.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="glass-card rounded-xl p-3 text-center">
              <p className="text-2xl font-serif font-bold text-primary">{allLists.length}</p>
              <p className="text-xs text-muted-foreground">Liste{allLists.length !== 1 ? "s" : ""}</p>
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
          {allLists.length > 1 && (
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

        {/* My Lists */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-pulse text-muted-foreground">Chargement...</div>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-serif font-semibold mb-3">📋 Mes listes</h2>
            {filteredMine.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingBasket className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-base font-medium">{search ? "Aucun résultat" : "Aucune liste"}</p>
                <p className="text-sm">{search ? "Essayez un autre terme" : "Créez votre première liste !"}</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredMine.map((list) => (
                  <ListCard key={list.id} list={list} onDelete={handleDelete} onDuplicate={handleDuplicate} />
                ))}
              </div>
            )}

            {/* Other users' lists */}
            {filteredOthers.length > 0 && (
              <>
                <h2 className="text-lg font-serif font-semibold mt-10 mb-3 flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  Toutes les listes
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredOthers.map((list) => (
                    <ListCard
                      key={list.id}
                      list={list}
                      onDelete={() => {}}
                      onDuplicate={() => {}}
                      isShared
                      ownerName={profiles[list.user_id] || "Utilisateur"}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
