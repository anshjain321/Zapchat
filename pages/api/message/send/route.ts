import { fetchRedis } from '@/helper/redis'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { pusherServer } from '@/lib/pusher'
import { toPusherkey } from '@/lib/utils'
import { Message, messageValidator } from '@/lib/validations/message'
import { nanoid } from 'nanoid'
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'

export default async function handler(req: NextApiRequest , res: NextApiResponse) {
  try {
    const { text, chatId }: { text: string; chatId: string } = await req.body
    const session = await getServerSession(req ,res,authOptions)

    if (!session) return res.status(401).json({message:'unauthorized'})

    const [userId1, userId2] = chatId.split('--')

    if (session.user.id !== userId1 && session.user.id !== userId2) {
      return res.status(401).json({message:'unauthorized'})

    }

    const friendId = session.user.id === userId1 ? userId2 : userId1

    const friendList = (await fetchRedis(
      'smembers',
      `user:${session.user.id}:friends`
    )) as string[]
    const isFriend = friendList.includes(friendId)

    if (!isFriend) {
      return res.status(401).json({message:'unauthorized'})
    }

    const rawSender = (await fetchRedis(
      'get',
      `user:${session.user.id}`
    )) as string
    const sender = JSON.parse(rawSender) as User

    const timestamp = Date.now()

    const messageData: Message = {
      id: nanoid(),
      senderId: session.user.id,
      text,
      timestamp,
    }

    const message = messageValidator.parse(messageData)
     
    await pusherServer.trigger(toPusherkey(`chat:${chatId}`), 'incoming-message', message)
  await pusherServer.trigger(toPusherkey(`user:${friendId}:chats`), 'new_message',{
     ...message,
     senderImg: sender.image,
     senderName: sender.name,
  })
    await db.zadd(`chat:${chatId}:messages`, {
      score: timestamp,
      member: JSON.stringify(message),
    })

    return res.json({message:'ok'})
  } catch (error) {
    if (error instanceof Error) {
      return  res.status(500).json({message:'error.message'})
    }

    return res.status(501).json({message: 'internal server error'})
  }
}