import { Link } from 'wouter'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-forest-green mb-4">404</h1>
        <p className="text-xl text-charcoal mb-8">Page not found</p>
        <Link href="/" className="px-8 py-3 bg-forest-green text-white rounded hover:bg-sage-green transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
