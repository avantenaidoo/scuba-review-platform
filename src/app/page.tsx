
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-slate-900">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Scuba Equipment Review Platform
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Explore scuba diving equipment, compare products, and read reviews
          from fellow divers. Share your own equipment experiences and help
          the diving community make more informed equipment decisions.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-cyan-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            Create account
          </Link>

          <Link
            href="/login"
            className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="px-6 py-4 text-center text-xs text-slate-500">
          © 2026 Scuba Equipment Review Platform. All rights reserved.
          <span className="mx-2">|</span>
          Application built by Avante Naidoo.
        </div>
      </footer>
    </main>
  );
}
