import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

type ContactFormData = {
  name: string
  email: string
  phone: string
  message: string
}

export default function Contact() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>()
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = async (data: ContactFormData) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        setSubmitted(true)
        reset()
        setTimeout(() => setSubmitted(false), 5000)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  return (
    <section id="contact" className="py-20 px-4 bg-cream">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gold"></div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-forest-green">Get In Touch</h2>
            <div className="h-1 w-12 bg-gold"></div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {submitted && (
              <div className="p-4 bg-green-100 text-green-700 rounded">
                Thank you! We'll be in touch soon.
              </div>
            )}

            <div>
              <input
                {...register('name', { required: 'Name is required' })}
                placeholder="Your Name"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-forest-green"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <input
                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                placeholder="Your Email"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-forest-green"
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <input
                {...register('phone', { required: 'Phone is required' })}
                placeholder="Your Phone"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-forest-green"
              />
              {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <textarea
                {...register('message', { required: 'Message is required' })}
                placeholder="Your Message"
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-forest-green"
              ></textarea>
              {errors.message && <p className="text-red-600 text-sm mt-1">{errors.message.message}</p>}
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-forest-green text-white font-bold rounded hover:bg-sage-green transition-colors"
            >
              Send Message
            </button>
          </form>

          <div className="space-y-8">
            <div className="flex gap-4">
              <MapPin className="text-forest-green flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-forest-green mb-1">Address</h3>
                <p className="text-charcoal">35 Mannion Way, Kardinya WA 6163</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Phone className="text-forest-green flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-forest-green mb-1">Phone</h3>
                <p className="text-charcoal">(08) 9331 8998</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Mail className="text-forest-green flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-forest-green mb-1">Email</h3>
                <p className="text-charcoal">hello@primopools.com.au</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Clock className="text-forest-green flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-forest-green mb-1">Hours</h3>
                <p className="text-charcoal">Mon-Fri: 8am - 6pm</p>
                <p className="text-charcoal">Sat: 9am - 4pm</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
