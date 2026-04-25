import { Router, Request, Response } from 'express'

const router = Router()

// Contact form endpoint
router.post('/contact', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, message } = req.body

    // Validate input
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Validate email format
    const emailRegex = /^\S+@\S+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Here you would typically:
    // 1. Save to database
    // 2. Send confirmation email
    // 3. Alert admin of new inquiry
    // For now, just log and return success

    console.log('New contact form submission:', { name, email, phone, message })

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Message received. We will contact you shortly.',
    })
  } catch (error) {
    console.error('Contact form error:', error)
    res.status(500).json({ error: 'Failed to process contact form' })
  }
})

export default router
