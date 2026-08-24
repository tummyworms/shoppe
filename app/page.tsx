import { getItems } from "@/lib/store";
import Gallery from "./_components/Gallery";
import MessengerButton from "./_components/MessengerButton";

// Always read the latest inventory (items change as they're added/sold).
export const dynamic = "force-dynamic";

export default async function Home() {
  const items = await getItems();

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <section className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">
          Curated pieces for the home
        </h1>
        <p className="mt-4 text-muted">
          Lamps, mirrors, art, and one-of-a-kind furnishings. See something you
          love? Message us on Facebook for pricing, shipping, or to arrange a
          visit.
        </p>
        <div className="mt-6">
          <MessengerButton label="Message us on Facebook" />
        </div>
      </section>

      <Gallery items={items} />
    </div>
  );
}
