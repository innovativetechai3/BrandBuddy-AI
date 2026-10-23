import Header, { Footer } from "@/components/Header";
import Studio from "@/components/Studio";

export default function Home() {
  return (
    <main className="flex-1">
      <Header />
      <Studio />
      <Footer />
    </main>
  );
}
