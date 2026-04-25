export default function OurStory() {
  return (
    <section id="story" className="py-20 px-4 bg-cream">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gold"></div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-forest-green">Our Story</h2>
          </div>
          <p className="text-lg text-charcoal leading-relaxed mb-6">
            For over 20 years, Primo Pools has been Western Australia's premier destination for luxury pool construction. We've transformed over 500 backyards into stunning oases, combining innovative design with meticulous craftsmanship.
          </p>
          <p className="text-lg text-charcoal leading-relaxed mb-6">
            Our team of expert designers and builders are passionate about creating pools that exceed expectations. From concept to completion, we deliver excellence.
          </p>
          <p className="text-lg text-charcoal leading-relaxed">
            Your dream pool isn't just our project—it's our passion.
          </p>
        </div>
        <div className="bg-sage-green/20 rounded-lg h-96 flex items-center justify-center">
          <p className="text-gray-400">Pool Image</p>
        </div>
      </div>
    </section>
  )
}
