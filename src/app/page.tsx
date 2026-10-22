import Studio from "@/components/Studio";

export default function Home() {
  return (
    <main className="flex-1">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <h1 className="text-2xl font-bold tracking-tight">
            Brand<span className="text-violet-600">Buddy</span> AI
          </h1>
          <p className="text-sm text-gray-600">
            Captions, product descriptions, hashtags and campaign ideas in English, اردو and Roman Urdu.
          </p>
        </div>
      </header>
      <Studio />
      <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-gray-500">
        AI-generated content can contain mistakes. Please review before posting. Your brand kit and history are saved
        only in this browser.
      </footer>
    </main>
  );
}
