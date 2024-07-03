import { fetchRedis } from "@/helper/redis";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { FC } from "react";
import FriendRequest from "@/components/FriendRequest";
const page: FC = async () => {
  const session = await getServerSession(authOptions);
  if (!session) notFound();
  const incomingSenderIds = (await fetchRedis(
    "smembers",
    `user:${session.user.id}:incoming_friend_requests`
  )) as string[];

   const incoming_friend_requests = await Promise.all(
    incomingSenderIds.map(async (senderId) =>{
        const sender = await fetchRedis('get' , `user:${senderId}`) as string
        const senderparsed = JSON.parse(sender) as User
        return {
            senderId ,
            senderEmail:  senderparsed.email
        }
    })
   )
 
  return  <main className="pt-8">
   <h1  className='font-bold text-5xl mb-8'>Add a Friend</h1>
   <FriendRequest incomingFriendRequests={incoming_friend_requests} sessionId = {session.user.id}/>
</main>
}
export default page;
