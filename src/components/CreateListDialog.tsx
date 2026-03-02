import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface Props {
  onCreateList: (name: string) => void;
}

export function CreateListDialog({ onCreateList }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateList(name.trim());
      setName("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 rounded-xl shadow-md">
          <Plus className="h-5 w-5" />
          Nouvelle liste
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Créer une liste</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex gap-3 mt-2">
          <Input
            placeholder="Ex: Courses de la semaine"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="flex-1"
          />
          <Button type="submit" disabled={!name.trim()}>
            Créer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
