import { Facebook, Instagram, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white py-16 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
        <div>
          <h3 className="text-2xl font-bold font-serif mb-4">Primo Pools</h3>
          <p className="text-gray-400">Western Australia's premier luxury pool construction company.</p>
        </div>

        <div>
          <h4 className="font-bold mb-4">Services</h4>
          <ul className="space-y-2 text-gray-400">
            <li><a href="#services" className="hover:text-white transition-colors">Pool Construction</a></li>
            <li><a href="#services" className="hover:text-white transition-colors">Renovations</a></li>
            <li><a href="#services" className="hover:text-white transition-colors">Water Features</a></li>
            <li><a href="#services" className="hover:text-white transition-colors">Landscaping</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4">Navigation</h4>
          <ul className="space-y-2 text-gray-400">
            <li><a href="#story" className="hover:text-white transition-colors">Our Story</a></li>
            <li><a href="#process" className="hover:text-white transition-colors">Process</a></li>
            <li><a href="#portfolio" className="hover:text-white transition-colors">Portfolio</a></li>
            <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4">Connect</h4>
          <div className="flex gap-4">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Facebook size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Instagram size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Linkedin size={20} />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
        <p>&copy; 2024 Primo Pools. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  )
}
