import express from 'express'
import Invoice from '../models/Invoice.js'

const router = express.Router()

// Generate invoice number
function generateInvoiceNumber() {
  return 'INV-' + Date.now()
}

// Get all invoices for a client
router.get('/client/:clientId', async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      where: { clientId: req.params.clientId },
      order: [['issueDate', 'DESC']]
    })
    res.json(invoices)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    res.json(invoice)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create invoice
router.post('/', async (req, res) => {
  try {
    const invoiceData = {
      ...req.body,
      invoiceNumber: generateInvoiceNumber()
    }
    const invoice = await Invoice.create(invoiceData)
    res.status(201).json(invoice)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update invoice
router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    await invoice.update(req.body)
    res.json(invoice)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mark invoice as paid
router.put('/:id/pay', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    await invoice.update({ status: 'paid', paidDate: new Date() })
    res.json(invoice)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    await invoice.destroy()
    res.json({ message: 'Invoice deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
