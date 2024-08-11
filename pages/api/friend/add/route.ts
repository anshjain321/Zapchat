import { fetchRedis } from "@/helper/redis";
import { authOptions } from "@/lib/auth";
import { addFriendValidator } from "@/lib/validations/add-friends";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { z } from 'zod';
import { NextApiRequest , NextApiResponse } from "next";
import { pusherServer } from "@/lib/pusher";
import { toPusherkey } from "@/lib/utils";

export default async function handler(req: NextApiRequest,res:NextApiResponse) {
    try {
      
        const body =  req.body.email; 
        const { email: emailToAdd } = addFriendValidator.parse(body);
        const idToAdd = await fetchRedis('get', `user:email:${emailToAdd}`) as string;

        if (!idToAdd) {
            res.status(400).json({ message: 'This person does not exist.' });
            return 
        }
        
        const session = await getServerSession(req,res,authOptions);
      
         console.log( JSON.stringify(session))
        if (!session) {
            res.status(401).json({ message: 'Unauthorized' });
            return
        }

        if (idToAdd === session.user.id) {
            res.status(400).json({ message: 'You cannot add yourself as a friend' });
          return
        }

        const isAlreadyAdded = await fetchRedis('sismember', `user:${idToAdd}:incoming_friend_requests`, session.user.id) as 0 | 1;
        if (isAlreadyAdded) {
            res.status(400).json({ message: 'Already added this user' });
           return
        }  

        const isAlreadyFriends = await fetchRedis('sismember', `user:${session.user.id}:friends`, idToAdd) as 0 | 1;
        if (isAlreadyFriends) {
             res.status(400).json({ message: 'Already friends with this user' });
            return 
        }
        await pusherServer.trigger(
            toPusherkey(`user:${idToAdd}:incoming_friend_requests`),'incoming_fiend_requests',
                {
                    senderId:session.user.id,
                    senderEmail:session.user.email,
                })
        
        await db.sadd(`user:${idToAdd}:incoming_friend_requests`, session.user.id);
        
     res.status(200).json({ message: 'Friend request sent!' });
     return
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(422).json({message:  'Invalid request payload' });
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
