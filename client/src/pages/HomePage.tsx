import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Hero from '../components/Hero'
import OurStory from '../components/OurStory'
import OurProcess from '../components/OurProcess'
import Services from '../components/Services'
import Portfolio from '../components/Portfolio'
import Testimonials from '../components/Testimonials'
import FAQ from '../components/FAQ'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import MobileNav from '../components/MobileNav'

export default function HomePage() {
  const [showMobileNav, setShowMobileNav] = useState(false)

  useEffect(() => {
    setShowMobileNav(window.innerWidth < 768)
    
    const handleResize = () => {
      setShowMobileNav(window.innerWidth < 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="bg-cream min-h-screen">
      <Header />
      <Hero />
      <OurStory />
      <OurProcess />
      <Services />
      <Portfolio />
      <Testimonials />
      <FAQ />
      <Contact />
      <Footer />
      {showMobileNav && <MobileNav />}
    </div>
  )
}
