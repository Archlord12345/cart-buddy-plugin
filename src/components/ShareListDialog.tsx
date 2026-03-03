import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Share2, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ShareEntry {
  id: string;
  shared_with_email: string;
  permission: string;
  shared_with_user_id: string | null;
}

interface Props {
  listId: string;
  listName: string;
}

export function ShareListDialog({ listId, listName }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [shares, setShares] = useState<ShareEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchShares = async () => {
    const { data } = await supabase
      .from("list_shares")
      .select("id, shared_with_email, permission, shared_with_user_id")
      .eq("list_id", listId);
    setShares((data as ShareEntry[]) || []);
  };

  useEffect(() => {
    if (open) fetchShares();
  }, [open]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !user) return;

    if (email.trim() === user.email) {
      toast.error("Vous ne pouvez pas partager avec vous-même");
      return;
    }

    const existing = shares.find(s => s.shared_with_email === email.trim());
    if (existing) {
      toast.error("Cette personne a déjà accès");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("list_shares").insert({
      list_id: listId,
      shared_with_email: email.trim(),
      permission,
      shared_by: user.id,
    });

    if (error) {
      toast.error("Erreur lors du partage");
    } else {
      toast.success(`Liste partagée avec ${email.trim()}`);
      setEmail("");
      fetchShares();
    }
    setLoading(false);
  };

  const handleRemoveShare = async (shareId: string) => {
    const { error } = await supabase.from("list_shares").delete().eq("id", shareId);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      fetchShares();
      toast.success("Accès retiré");
    }
  };

  const handleUpdatePermission = async (shareId: string, newPermission: string) => {
    const { error } = await supabase
      .from("list_shares")
      .update({ permission: newPermission })
      .eq("id", shareId);
    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      fetchShares();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl">
          <Share2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Partager « {listName} »</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleShare} className="flex gap-2 mt-2">
          <Input
            type="email"
            placeholder="Email de la personne..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-xl"
            required
          />
          <Select value={permission} onValueChange={(v) => setPermission(v as "view" | "edit")}>
            <SelectTrigger className="w-28 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="view">Lecture</SelectItem>
              <SelectItem value="edit">Édition</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="icon" disabled={loading} className="rounded-xl flex-shrink-0">
            <UserPlus className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-4 space-y-2">
          {shares.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun partage pour cette liste
            </p>
          ) : (
            shares.map((share) => (
              <div key={share.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{share.shared_with_email}</p>
                  {!share.shared_with_user_id && (
                    <p className="text-xs text-muted-foreground">Pas encore inscrit</p>
                  )}
                </div>
                <Select
                  value={share.permission}
                  onValueChange={(v) => handleUpdatePermission(share.id, v)}
                >
                  <SelectTrigger className="w-24 h-8 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Lecture</SelectItem>
                    <SelectItem value="edit">Édition</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleRemoveShare(share.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
