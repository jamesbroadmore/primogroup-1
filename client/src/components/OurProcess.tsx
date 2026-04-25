import { CheckCircle } from 'lucide-react'

export default function OurProcess() {
  const steps = [
    { number: 1, title: 'Consultation', description: 'Understanding your vision and requirements' },
    { number: 2, title: 'Design', description: 'Creating custom designs tailored to your space' },
    { number: 3, title: 'Engineering', description: 'Ensuring structural integrity and compliance' },
    { number: 4, title: 'Build', description: 'Expert construction with quality oversight' },
    { number: 5, title: 'Handover', description: 'Delivering your completed dream pool' },
  ]

  return (
    <section id="process" className="py-20 px-4 bg-warm-beige">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gold"></div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-forest-green">Our Process</h2>
            <div className="h-1 w-12 bg-gold"></div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-5 gap-6 mb-12">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-forest-green text-white flex items-center justify-center text-2xl font-bold font-serif">
                  {step.number}
                </div>
              </div>
              <h3 className="text-xl font-bold text-forest-green mb-2">{step.title}</h3>
              <p className="text-charcoal text-sm">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-white p-8 rounded-lg border-l-4 border-gold">
          <div className="flex gap-3 mb-2">
            <CheckCircle className="text-forest-green flex-shrink-0" />
            <h3 className="text-xl font-bold text-forest-green">Quality Guaranteed</h3>
          </div>
          <p className="text-charcoal">Every project is backed by our commitment to excellence and customer satisfaction</p>
        </div>
      </div>
    </section>
  )
}
