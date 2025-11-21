import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-primary">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="text-4xl font-bold text-primary">The Fringe Admin Panel</h1>
      <p className="text-lg text-secondary">Welcome to the admin dashboard.</p>
    </main>
  )
}