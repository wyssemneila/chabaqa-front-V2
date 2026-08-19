#!/usr/bin/env node

/**
 * Safely adds polymorphic reference metadata to legacy HELP_DM records.
 *
 * Older records stored an Admin ObjectId in Conversation.participantB and in
 * Message.senderId/recipientId, while those fields were declared as User
 * references. This migration only writes model-discriminator fields; it never
 * changes IDs, text, attachments, or deletes data.
 *
 * Run with MONGO_URI (or MONGODB_URI) in the environment. Use --dry-run first.
 */
const { MongoClient } = require('mongodb')

const uri = process.env.MONGO_URI || process.env.MONGODB_URI
const dryRun = process.argv.includes('--dry-run')

if (!uri) {
  console.error('MONGO_URI or MONGODB_URI is required')
  process.exit(1)
}

const sameId = (left, right) => String(left || '') === String(right || '')

async function main() {
  const client = new MongoClient(uri)
  await client.connect()

  try {
    const database = client.db()
    const conversations = database.collection('conversations')
    const messages = database.collection('messages')
    const admins = database.collection('admins')

    const helpThreads = await conversations.find({
      type: 'HELP_DM',
      participantB: { $exists: true, $ne: null },
    }).toArray()

    const adminIds = helpThreads.map((thread) => thread.participantB)
    const adminRows = adminIds.length
      ? await admins.find({ _id: { $in: adminIds } }, { projection: { _id: 1 } }).toArray()
      : []
    const validAdminIds = new Set(adminRows.map((admin) => String(admin._id)))

    const migratedThreads = helpThreads.filter((thread) => validAdminIds.has(String(thread.participantB)))
    const skippedThreads = helpThreads.length - migratedThreads.length

    let conversationUpdates = 0
    let messageUpdates = 0

    for (const thread of migratedThreads) {
      if (thread.participantBModel !== 'Admin') {
        conversationUpdates += 1
        if (!dryRun) {
          await conversations.updateOne(
            { _id: thread._id },
            { $set: { participantBModel: 'Admin' } },
          )
        }
      }

      const threadMessages = await messages.find({ conversationId: thread._id }).toArray()
      for (const message of threadMessages) {
        const set = {}
        const adminId = thread.participantB
        const senderModel = sameId(message.senderId, adminId) ? 'Admin' : 'User'
        const recipientModel = sameId(message.recipientId, adminId) ? 'Admin' : 'User'

        if (message.senderModel !== senderModel) set.senderModel = senderModel
        if (message.recipientModel !== recipientModel) set.recipientModel = recipientModel
        if (message.editedBy) set.editedByModel = sameId(message.editedBy, adminId) ? 'Admin' : 'User'
        if (message.deletedBy) set.deletedByModel = sameId(message.deletedBy, adminId) ? 'Admin' : 'User'
        if (message.pinnedBy) set.pinnedByModel = sameId(message.pinnedBy, adminId) ? 'Admin' : 'User'

        if (Array.isArray(message.editHistory)) {
          const nextHistory = message.editHistory.map((entry) => ({
            ...entry,
            editedByModel: sameId(entry?.editedBy, adminId) ? 'Admin' : 'User',
          }))
          if (JSON.stringify(nextHistory) !== JSON.stringify(message.editHistory)) {
            set.editHistory = nextHistory
          }
        }

        if (Object.keys(set).length > 0) {
          messageUpdates += 1
          if (!dryRun) {
            await messages.updateOne({ _id: message._id }, { $set: set })
          }
        }
      }
    }

    console.log(JSON.stringify({
      mode: dryRun ? 'dry-run' : 'apply',
      helpThreadsFound: helpThreads.length,
      threadsUpdated: conversationUpdates,
      messagesUpdated: messageUpdates,
      threadsSkippedBecauseParticipantBIsNotAnAdmin: skippedThreads,
    }))
  } finally {
    await client.close()
  }
}

main().catch((error) => {
  console.error('HELP_DM reference migration failed:', error?.message || error)
  process.exit(1)
})
