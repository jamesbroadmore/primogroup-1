import { ChevronDown } from 'lucide-react'

export default function Hero() {
  return (
    <section className="w-full h-screen bg-gradient-to-b from-forest-green/90 to-forest-green/70 flex items-center justify-center text-white pt-20">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl md:text-7xl font-bold font-serif mb-6 text-pretty">
          Transform Your Backyard into an Oasis
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-gray-100">
          Custom luxury pool design and construction for Western Australia's most discerning homeowners
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center mb-12">
          <button className="px-8 py-3 bg-gold text-forest-green font-bold rounded hover:bg-opacity-90 transition-all">
            View Portfolio
          </button>
          <button className="px-8 py-3 border-2 border-white text-white font-bold rounded hover:bg-white/10 transition-all">
            Schedule Consultation
          </button>
        </div>
        <div className="flex justify-center gap-8 text-sm mb-12">
          <div>
            <p className="font-bold text-lg">20+</p>
            <p>Years Experience</p>
          </div>
          <div>
            <p className="font-bold text-lg">500+</p>
            <p>Projects Completed</p>
          </div>
          <div>
            <p className="font-bold text-lg">5★</p>
            <p>Rated</p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 animate-bounce">
        <ChevronDown size={32} />
      </div>
    </section>
  )
}
