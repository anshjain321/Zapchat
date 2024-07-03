import { authOptions } from "@/lib/auth";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { db } from "@/lib/db";


export default async function handler(req: NextApiRequest , res: NextApiResponse){
    try{
    const body = await req.body;
    const session = await getServerSession(req,res,authOptions);
    if(!session){
        res.status(401).json({message: 'unauthorized'});
        return;
    }
    const {id: idToDeny} = z.object({id: z.string()}).parse(body);
    await db.srem(`user:${session.user.id}:incoming_friend_requests`, idToDeny)
    res.status(200).json({message:'ok'});
}
catch(error){
    if(error instanceof z.ZodError){
        res.status(422).json({message: 'Invalid Request payload'})
    }
    res.status(400).json({message:'invalid request'});
}
}