import type { Metadata } from "next";
import Link from "next/link";
import BrandKitEditor from "@/components/BrandKitEditor";
import Header, { Footer } from "@/components/Header";

export const metadata: Metadata = { title: "Brand kits – BrandBuddy AI" };

export default function BrandKitPage() {
  return (
    <main className="flex-1">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <h1 className="mb-1 text-xl font-semibold">Brand kits</h1>
          <p className="mb-5 text-sm text-gray-600">
            Your logo, colours, font and voice. They are used on every post image and slide, and the AI follows your
            voice notes and banned words. Changes save automatically.
          </p>
          <BrandKitEditor />
        </div>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-violet-600 px-4 py-2.5 font-semibold text-white hover:bg-violet-700"
        >
          ← Back to studio
        </Link>
      </div>
      <Footer />
    </main>
  );
}
