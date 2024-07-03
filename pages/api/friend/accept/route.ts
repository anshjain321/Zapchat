import { NextApiRequest, NextApiResponse } from "next";
import {z} from 'zod';
import { getServerSession } from "next-auth";
import { pusherServer} from "@/lib/pusher";
import { toPusherkey } from "@/lib/utils";
import { authOptions } from "@/lib/auth";
import { fetchRedis } from "@/helper/redis"
import { db } from "@/lib/db";
export default async function handler(req:NextApiRequest , res: NextApiResponse){
    try{
      const body= await req.body;
      const { id: idToAdd } = z.object({ id: z.string() }).parse(body)
      const session = await getServerSession(req,res,authOptions)
      if(!session){
        res.status(401).json({message: 'unauthorized'})
        return
      }
      
    const isAlreadyFriends = await fetchRedis(
        'sismember',
        `user:${session.user.id}:friends`,
        idToAdd
      )
      if (isAlreadyFriends) {
      res.status(400).json({message:'already friend'});
      return
      }
      
    const hasFriendRequest = await fetchRedis(
        'sismember',
        `user:${session.user.id}:incoming_friend_requests`,
        idToAdd
      )
      if (!hasFriendRequest) {
       res.status(400).json({message:'no friend request'})
      }
      const [userRaw, friendRaw] = (await Promise.all([
        fetchRedis('get', `user:${session.user.id}`),
        fetchRedis('get', `user:${idToAdd}`),
      ])) as [string, string]
  
      const user = JSON.parse(userRaw) as User
      const friend = JSON.parse(friendRaw) as User

      await Promise.all([
        pusherServer.trigger(
          toPusherkey(`user:${idToAdd}:friends`),
          'new_friend',
          user
        ),
        pusherServer.trigger(
          toPusherkey(`user:${session.user.id}:friends`),
          'new_friend',
          friend
        ),


      db.sadd(`user:${session.user.id}:friends` ,idToAdd),
      db.sadd(`user:${idToAdd}:friends` , session.user.id),
      db.srem(`user:${session.user.id}:incoming_friend_requests`, idToAdd),
      ])
     res.status(200).json({message: 'ok'})
    }
    catch(error){
      if(error instanceof z.ZodError){
        res.status(422).json({message:'Invalid request payload'})
      } 
        res.status(400).json({message: 'invaid request'})     
    }
}