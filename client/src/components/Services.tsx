import { Waves, Hammer, Leaf, Wrench, Sparkles } from 'lucide-react'

export default function Services() {
  const services = [
    { icon: Waves, title: 'New Pool Construction', description: 'Custom designed pools built to your specifications' },
    { icon: Hammer, title: 'Pool Renovations', description: 'Transform aging pools into modern masterpieces' },
    { icon: Sparkles, title: 'Water Features', description: 'Cascades, fountains, and advanced water systems' },
    { icon: Leaf, title: 'Pool Landscaping', description: 'Complete outdoor design and hardscaping' },
    { icon: Wrench, title: 'Maintenance & Repairs', description: 'Professional care to keep your pool perfect' },
  ]

  return (
    <section id="services" className="py-20 px-4 bg-cream">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gold"></div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-forest-green">Our Services</h2>
            <div className="h-1 w-12 bg-gold"></div>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <div key={index} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <Icon className="text-forest-green w-12 h-12 mb-4" />
                <h3 className="text-lg font-bold text-forest-green mb-2">{service.title}</h3>
                <p className="text-charcoal text-sm">{service.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
