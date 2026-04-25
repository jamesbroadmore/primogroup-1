export default function Portfolio() {
  const projects = [
    { title: 'Modern Infinity Edge', location: 'Perth, WA', image: 'Pool 1' },
    { title: 'Mediterranean Paradise', location: 'Como, WA', image: 'Pool 2' },
    { title: 'Contemporary Lap Pool', location: 'Subiaco, WA', image: 'Pool 3' },
    { title: 'Resort-Style Oasis', location: 'Nedlands, WA', image: 'Pool 4' },
    { title: 'Luxury Water Feature', location: 'Dalkeith, WA', image: 'Pool 5' },
    { title: 'Family Entertainment', location: 'Fremantle, WA', image: 'Pool 6' },
  ]

  return (
    <section id="portfolio" className="py-20 px-4 bg-warm-beige">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gold"></div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-forest-green">Featured Projects</h2>
            <div className="h-1 w-12 bg-gold"></div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <div key={index} className="group overflow-hidden rounded-lg">
              <div className="bg-sage-green/20 h-64 flex items-center justify-center relative overflow-hidden">
                <p className="text-gray-400">{project.image}</p>
                <div className="absolute inset-0 bg-forest-green/0 group-hover:bg-forest-green/20 transition-all duration-300"></div>
              </div>
              <div className="bg-white p-6">
                <h3 className="text-xl font-bold text-forest-green mb-2">{project.title}</h3>
                <p className="text-charcoal">{project.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
