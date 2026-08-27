import { getItems } from "@/lib/store";
import Shop from "./_components/Shop";

// Always read the latest inventory (items change as they're added/sold).
export const dynamic = "force-dynamic";

export default async function Home() {
  const items = await getItems();
  return <Shop initialItems={items} />;
}
