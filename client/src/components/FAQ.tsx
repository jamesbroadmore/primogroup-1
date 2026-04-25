import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: 'How long does a pool construction project typically take?',
      answer: 'Most projects take 2-4 months from design approval to completion, depending on complexity and site conditions.',
    },
    {
      question: 'What is the typical cost range for a new pool?',
      answer: 'Pool costs vary based on size, design, and features. We recommend scheduling a consultation for an accurate quote.',
    },
    {
      question: 'Do you offer financing options?',
      answer: 'Yes, we partner with several lenders to help finance your pool project. Ask about available options.',
    },
    {
      question: 'What warranty do you provide?',
      answer: 'We provide a 5-year structural warranty and ongoing maintenance support for all new installations.',
    },
    {
      question: 'Can you renovate my existing pool?',
      answer: 'Absolutely! We specialize in pool renovations and can update everything from surfaces to systems.',
    },
  ]

  return (
    <section className="py-20 px-4 bg-warm-beige">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gold"></div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-forest-green">FAQ</h2>
            <div className="h-1 w-12 bg-gold"></div>
          </div>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-bold text-forest-green text-left">{faq.question}</h3>
                <ChevronDown
                  size={24}
                  className={`text-forest-green flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-charcoal border-t border-gray-200">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
