import { useState, useMemo } from "react";
import { getLists, createList, deleteList, ShoppingList } from "@/lib/store";
import { CreateListDialog } from "@/components/CreateListDialog";
import { ListCard } from "@/components/ListCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBasket } from "lucide-react";

type SortOption = "recent" | "oldest" | "name" | "items";

export default function Index() {
  const [lists, setLists] = useState<ShoppingList[]>(getLists);
  const [sort, setSort] = useState<SortOption>("recent");

  const refresh = () => setLists(getLists());

  const handleCreate = (name: string) => {
    createList(name);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteList(id);
    refresh();
  };

  const sorted = useMemo(() => {
    const copy = [...lists];
    switch (sort) {
      case "recent":
        return copy.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      case "oldest":
        return copy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case "name":
        return copy.sort((a, b) => a.name.localeCompare(b.name));
      case "items":
        return copy.sort((a, b) => b.items.length - a.items.length);
      default:
        return copy;
    }
  }, [lists, sort]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <ShoppingBasket className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-serif font-bold">Mes Courses</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Gérez vos listes de courses facilement
        </p>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <CreateListDialog onCreateList={handleCreate} />
          {lists.length > 1 && (
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-44 rounded-xl">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Plus récent</SelectItem>
                <SelectItem value="oldest">Plus ancien</SelectItem>
                <SelectItem value="name">Nom A-Z</SelectItem>
                <SelectItem value="items">Nb d'articles</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Lists grid */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ShoppingBasket className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Aucune liste</p>
            <p className="text-sm">Créez votre première liste de courses !</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sorted.map((list) => (
              <ListCard key={list.id} list={list} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
