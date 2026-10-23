import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-black/5 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Brand<span className="text-violet-600">Buddy</span> AI
          </Link>
          <p className="text-sm text-gray-600">A week of posts in English, اردو and Roman Urdu.</p>
        </div>
        <nav className="flex gap-1 text-sm font-medium">
          <Link href="/" className="rounded-lg px-3 py-2 hover:bg-gray-100">
            Studio
          </Link>
          <Link href="/brand-kit" className="rounded-lg px-3 py-2 hover:bg-gray-100">
            Brand kits
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-gray-500">
      AI-generated content can contain mistakes, so please review it before posting. Don&apos;t enter private customer
      data: the free AI service may use inputs to improve its products. Brand kits and history are saved only in this
      browser.
    </footer>
  );
}
