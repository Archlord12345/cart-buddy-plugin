export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  quantity: number;
  category?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  emoji: string;
  items: ShoppingItem[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "shopping-lists";

const EMOJIS = ["🛒", "🥦", "🍎", "🧀", "🥖", "🍕", "🧃", "🏠", "🎉", "☕"];

export function getRandomEmoji(): string {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function getLists(): ShoppingList[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveLists(lists: ShoppingList[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
}

export function createList(name: string): ShoppingList {
  const list: ShoppingList = {
    id: generateId(),
    name,
    emoji: getRandomEmoji(),
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const lists = getLists();
  lists.push(list);
  saveLists(lists);
  return list;
}

export function deleteList(id: string) {
  const lists = getLists().filter((l) => l.id !== id);
  saveLists(lists);
}

export function getList(id: string): ShoppingList | undefined {
  return getLists().find((l) => l.id === id);
}

export function updateList(id: string, updates: Partial<ShoppingList>) {
  const lists = getLists().map((l) =>
    l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
  );
  saveLists(lists);
}

export function addItem(listId: string, name: string, quantity = 1) {
  const lists = getLists().map((l) => {
    if (l.id === listId) {
      return {
        ...l,
        items: [...l.items, { id: generateId(), name, checked: false, quantity }],
        updatedAt: new Date().toISOString(),
      };
    }
    return l;
  });
  saveLists(lists);
}

export function toggleItem(listId: string, itemId: string) {
  const lists = getLists().map((l) => {
    if (l.id === listId) {
      return {
        ...l,
        items: l.items.map((i) =>
          i.id === itemId ? { ...i, checked: !i.checked } : i
        ),
        updatedAt: new Date().toISOString(),
      };
    }
    return l;
  });
  saveLists(lists);
}

export function removeItem(listId: string, itemId: string) {
  const lists = getLists().map((l) => {
    if (l.id === listId) {
      return {
        ...l,
        items: l.items.filter((i) => i.id !== itemId),
        updatedAt: new Date().toISOString(),
      };
    }
    return l;
  });
  saveLists(lists);
}
