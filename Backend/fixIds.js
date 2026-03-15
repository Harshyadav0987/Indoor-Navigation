const mongoose = require('mongoose')
const Node = require('./models/Node')
const Edge = require('./models/Edge')

mongoose.connect('mongodb://localhost:27017/indoornav')

function cleanId(id) {
  return id.replace(/\//g, '_').replace(/\s+/g, '_')
}

async function fixAll() {
  const nodes = await Node.find()
  console.log(`Found ${nodes.length} nodes to fix...`)

  for (const node of nodes) {
    const newId = cleanId(node.id)
    const newLabel = cleanId(node.label) // ← fix label too

    if (newId !== node.id || newLabel !== node.label) {
      console.log(`Fixing: ${node.id} → ${newId}`)

      await Edge.updateMany({ from: node.id }, { from: newId })
      await Edge.updateMany({ to: node.id }, { to: newId })

      await Node.findByIdAndUpdate(node._id, { id: newId, label: newLabel })
    }
  }

  console.log('✅ All done!')
  mongoose.disconnect()
}

fixAll().catch(console.error)