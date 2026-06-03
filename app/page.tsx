import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 dark:bg-black font-sans">
      <main className="flex w-full max-w-3xl flex-col items-center gap-10 px-6 py-24 text-center sm:text-left sm:items-start">
        {/* Logo */}
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={24}
          priority
        />

        {/* Heading */}
        <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-white">
          Next.js Starter Template
        </h1>

        {/* Description */}
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl">
          This project is a ready-to-use starter built with{" "}
          <span className="font-medium text-black dark:text-white">
            Next.js
          </span>
          ,{" "}
          <span className="font-medium text-black dark:text-white">
            Supabase
          </span>
          , and{" "}
          <span className="font-medium text-black dark:text-white">
            shadcn/ui
          </span>
          . It provides a solid foundation for building modern web applications.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 h-11 flex items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black hover:opacity-80 transition"
          >
            Get Started
          </a>

          <a
            href="https://supabase.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 h-11 flex items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Docs
          </a>
        </div>
      </main>
    </div>
  );
}
