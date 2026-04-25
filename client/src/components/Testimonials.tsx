import { useState } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const testimonials = [
    {
      name: 'James Mitchell',
      quote: 'Primo Pools exceeded all our expectations. The design process was seamless and the final result is stunning.',
      rating: 5,
      image: 'JM',
    },
    {
      name: 'Sarah Williams',
      quote: 'From concept to completion, the team was professional and dedicated. Our pool is the talk of the neighborhood!',
      rating: 5,
      image: 'SW',
    },
    {
      name: 'Michael Davis',
      quote: 'Exceptional craftsmanship and attention to detail. This is a pool built to last generations.',
      rating: 5,
      image: 'MD',
    },
  ]

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const currentTestimonial = testimonials[currentIndex]

  return (
    <section className="py-20 px-4 bg-cream">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gold"></div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-forest-green">Testimonials</h2>
            <div className="h-1 w-12 bg-gold"></div>
          </div>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-lg shadow-lg">
          <div className="flex gap-4 items-start mb-6">
            <div className="w-16 h-16 rounded-full bg-forest-green text-white flex items-center justify-center font-bold">
              {currentTestimonial.image}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-forest-green mb-2">{currentTestimonial.name}</h3>
              <div className="flex gap-1">
                {[...Array(currentTestimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} className="fill-gold text-gold" />
                ))}
              </div>
            </div>
          </div>

          <p className="text-lg text-charcoal mb-8 leading-relaxed italic">
            "{currentTestimonial.quote}"
          </p>

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-all ${
                    i === currentIndex ? 'bg-forest-green w-6' : 'bg-gray-300'
                  }`}
                ></div>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={prevSlide} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ChevronLeft size={24} className="text-forest-green" />
              </button>
              <button onClick={nextSlide} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ChevronRight size={24} className="text-forest-green" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
