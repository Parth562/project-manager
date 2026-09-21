import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="max-w-2xl text-3xl font-semibold text-gray-900 md:text-4xl">
        AI-Assisted Software Project Management Platform
      </h1>
      <p className="max-w-xl text-gray-600">
        A project management platform that helps software teams manage
        requirements, user stories, tasks, sprints, testing, and bugs, with
        AI assistance for generating user stories from software requirements.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700"
      >
        Go to Dashboard
      </Link>
    </main>
  );
}
