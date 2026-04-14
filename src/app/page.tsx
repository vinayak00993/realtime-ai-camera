import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Logo / Title */}
        <div className="mb-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg shadow-blue-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-10 h-10"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            Live<span className="text-blue-400">Lens</span>
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-lg text-white/60 max-w-sm mb-12 animate-fade-in-delay-1">
          Your AI-powered companion for everyday tasks. Point your camera, get instant guidance.
        </p>

        {/* Feature cards */}
        <div className="grid gap-4 w-full max-w-sm mb-12">
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5 animate-slide-up-1">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-white/90">Real-time Vision</h3>
              <p className="text-xs text-white/40">AI sees what you see through your camera</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5 animate-slide-up-2">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-white/90">Voice Interaction</h3>
              <p className="text-xs text-white/40">Ask questions hands-free while you work</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5 animate-slide-up-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-white/90">Spoken Guidance</h3>
              <p className="text-xs text-white/40">Hear step-by-step help while cooking, building, or fixing</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/camera"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-8 py-4 rounded-full text-lg shadow-lg shadow-blue-500/25 active:scale-95 transition-transform animate-fade-in-delay-2"
        >
          Get Started
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-white/25">Created by Vinayak Rao</p>
      </footer>
    </div>
  );
}
