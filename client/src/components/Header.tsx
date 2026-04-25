import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMenuOpen(false)
    }
  }

  return (
    <header className={`fixed w-full z-50 transition-all ${isScrolled ? 'bg-white shadow-md' : 'bg-transparent'}`}>
      <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-forest-green font-serif">Primo Pools</div>
        
        <div className="hidden md:flex gap-8">
          <button onClick={() => scrollToSection('story')} className="text-charcoal hover:text-forest-green">Home</button>
          <button onClick={() => scrollToSection('story')} className="text-charcoal hover:text-forest-green">Our Story</button>
          <button onClick={() => scrollToSection('portfolio')} className="text-charcoal hover:text-forest-green">Portfolio</button>
          <button onClick={() => scrollToSection('process')} className="text-charcoal hover:text-forest-green">Process</button>
          <button onClick={() => scrollToSection('services')} className="text-charcoal hover:text-forest-green">Services</button>
          <button onClick={() => scrollToSection('contact')} className="text-charcoal hover:text-forest-green">Contact</button>
        </div>

        <button className="hidden md:block px-6 py-2 bg-forest-green text-white rounded hover:bg-sage-green transition-colors">
          Get Quote
        </button>

        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="px-4 py-2 space-y-2">
            <button onClick={() => scrollToSection('story')} className="block w-full text-left py-2 text-charcoal hover:text-forest-green">Home</button>
            <button onClick={() => scrollToSection('story')} className="block w-full text-left py-2 text-charcoal hover:text-forest-green">Our Story</button>
            <button onClick={() => scrollToSection('portfolio')} className="block w-full text-left py-2 text-charcoal hover:text-forest-green">Portfolio</button>
            <button onClick={() => scrollToSection('process')} className="block w-full text-left py-2 text-charcoal hover:text-forest-green">Process</button>
            <button onClick={() => scrollToSection('services')} className="block w-full text-left py-2 text-charcoal hover:text-forest-green">Services</button>
            <button onClick={() => scrollToSection('contact')} className="block w-full text-left py-2 text-charcoal hover:text-forest-green">Contact</button>
            <button className="w-full px-6 py-2 bg-forest-green text-white rounded hover:bg-sage-green mt-2">Get Quote</button>
          </div>
        </div>
      )}
    </header>
  )
}
