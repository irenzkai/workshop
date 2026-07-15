import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-extrabold text-gray-900">Next.js To-Do App</h1>
        <p className="text-gray-600">A secure, lightweight list manager powered by Neon Postgres.</p>
        <div className="flex flex-col space-y-3">
          <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-md transition duration-150">
            Log In
          </Link>
          <Link href="/register" className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-md transition duration-150">
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}