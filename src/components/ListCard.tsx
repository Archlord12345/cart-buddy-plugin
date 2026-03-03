import type { ShoppingList } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Trash2, ChevronRight, MoreVertical, Copy, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  list: ShoppingList;
  onDelete: (id: string) => void;
  onDuplicate: (list: ShoppingList) => void;
  isShared?: boolean;
  ownerName?: string;
}

export function ListCard({ list, onDelete, onDuplicate, isShared, ownerName }: Props) {
  const navigate = useNavigate();
  const checkedCount = list.shopping_items.filter((i) => i.checked).length;
  const totalCount = list.shopping_items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  return (
    <Card
      className="glass-card group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
      onClick={() => navigate(`/list/${list.id}`)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl flex-shrink-0">{list.emoji}</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-base truncate">{list.name}</h3>
              <p className="text-sm text-muted-foreground">
                {ownerName && <span className="font-medium">{ownerName} · </span>}
                {totalCount} article{totalCount !== 1 ? "s" : ""} · {format(new Date(list.updated_at), "d MMM", { locale: fr })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isShared ? (
              <Badge variant="secondary" className="text-xs">Partagée</Badge>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => navigate(`/list/${list.id}`)}>
                    <Pencil className="h-4 w-4 mr-2" /> Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(list)}>
                    <Copy className="h-4 w-4 mr-2" /> Dupliquer
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(list.id)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {totalCount > 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {checkedCount}/{totalCount} complété{checkedCount !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
