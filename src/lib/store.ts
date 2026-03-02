import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ShoppingList = Tables<"shopping_lists"> & {
  shopping_items: Tables<"shopping_items">[];
};

export type ShoppingItem = Tables<"shopping_items">;

const EMOJIS = ["🛒", "🥦", "🍎", "🧀", "🥖", "🍕", "🧃", "🏠", "🎉", "☕", "🥩", "🍳", "🥗", "🍰"];

export function getRandomEmoji(): string {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
}

export async function fetchLists(): Promise<ShoppingList[]> {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("*, shopping_items(*)")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data as ShoppingList[]) || [];
}

export async function fetchList(id: string): Promise<ShoppingList | null> {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("*, shopping_items(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as ShoppingList | null;
}

export async function createList(userId: string, name: string) {
  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({ user_id: userId, name, emoji: getRandomEmoji() })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateListName(id: string, name: string) {
  const { error } = await supabase
    .from("shopping_lists")
    .update({ name })
    .eq("id", id);

  if (error) throw error;
}

export async function updateListEmoji(id: string, emoji: string) {
  const { error } = await supabase
    .from("shopping_lists")
    .update({ emoji })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteList(id: string) {
  const { error } = await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function duplicateList(userId: string, list: ShoppingList) {
  const newList = await createList(userId, `${list.name} (copie)`);
  if (list.shopping_items.length > 0) {
    const items = list.shopping_items.map((item) => ({
      list_id: newList.id,
      user_id: userId,
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      checked: false,
    }));
    const { error } = await supabase.from("shopping_items").insert(items);
    if (error) throw error;
  }
  return newList;
}

export async function addItem(listId: string, userId: string, name: string, quantity = 1, category?: string) {
  const { error } = await supabase
    .from("shopping_items")
    .insert({ list_id: listId, user_id: userId, name, quantity, category });

  if (error) throw error;
}

export async function toggleItem(itemId: string) {
  const { data: item } = await supabase
    .from("shopping_items")
    .select("checked")
    .eq("id", itemId)
    .single();

  if (item) {
    const { error } = await supabase
      .from("shopping_items")
      .update({ checked: !item.checked })
      .eq("id", itemId);

    if (error) throw error;
  }
}

export async function updateItemQuantity(itemId: string, quantity: number) {
  const { error } = await supabase
    .from("shopping_items")
    .update({ quantity })
    .eq("id", itemId);

  if (error) throw error;
}

export async function removeItem(itemId: string) {
  const { error } = await supabase
    .from("shopping_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
}

export async function clearCheckedItems(listId: string) {
  const { error } = await supabase
    .from("shopping_items")
    .delete()
    .eq("list_id", listId)
    .eq("checked", true);

  if (error) throw error;
}
