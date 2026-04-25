import { Phone, MessageCircle, ArrowRight } from 'lucide-react'

export default function MobileNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex gap-2 p-2 z-40">
      <a
        href="https://wa.me/61893318998"
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
      >
        <MessageCircle size={20} />
        <span className="text-sm font-bold">Chat</span>
      </a>
      <a
        href="tel:0893318998"
        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        <Phone size={20} />
        <span className="text-sm font-bold">Call</span>
      </a>
      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-forest-green text-white rounded hover:bg-sage-green transition-colors">
        <ArrowRight size={20} />
        <span className="text-sm font-bold">Quote</span>
      </button>
    </div>
  )
}
