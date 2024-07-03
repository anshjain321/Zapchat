'use client'
import { UserPlus } from 'lucide-react'
import {FC , useEffect, useState} from 'react'
import { X } from 'lucide-react'
import { Check } from 'lucide-react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { pusherClient } from '@/lib/pusher'
import { toPusherkey } from '@/lib/utils'

interface FriendRequestProps {
    incomingFriendRequests: incomingFriendRequest[]
    sessionId: string 
}

const FriendRequest: FC<FriendRequestProps> = ({
    incomingFriendRequests,
    sessionId,
}) =>{
    const router = useRouter();
  const [friendRequests, setfriendRequests] = useState<incomingFriendRequest[]>(
    incomingFriendRequests)

   useEffect(()=>{
    pusherClient.subscribe(toPusherkey(`user:${sessionId}:incoming_friend_requests`))
    const friendRequestHandler = ({senderId , senderEmail}:incomingFriendRequest )=>{
        setfriendRequests((prev)=>[...prev,{senderId,senderEmail}])
    }
    pusherClient.bind('incoming_friend_requests', friendRequestHandler)
    return ()=>{
        pusherClient.unsubscribe(
            toPusherkey(`user:${sessionId}:incoming_friend_requests`)
        )
        pusherClient.unbind('incoming_friend_requests' , friendRequestHandler)
    }
   },[sessionId])

    const acceptFriend = async(senderId:string) =>{
        await axios.post('/api/friend/accept/route' , {id: senderId})
        setfriendRequests((prev) => prev.filter((request) => request.senderId !== senderId))
         router.refresh();
    }
    const denyFriend = async(senderId:string) =>{
        await axios.post('/api/friend/deny/route' , {id: senderId})
        setfriendRequests((prev) => prev.filter((request) => request.senderId !== senderId))
         router.refresh();
    }


  return (
  <>
   {friendRequests.length == 0 ? (
    <p className='text-sm text-zinc-500'>nothing to show here</p>
   ): (
   friendRequests.map((request) =>(
    <div key={request.senderId} className='flex gap-4 items-center' >
        <UserPlus className='text-black'/>
        <p className='font-medium text-lg'>{request.senderEmail}</p>
        <button onClick={()=>acceptFriend(request.senderId)} aria-label='accept friend' className='w-8 h-8 bg-indigo-600 hover:bg-indigo-700 grid place-items-center rounded-full transition hover:shadow-md'>
            <Check className ='font-semibold w-3/4 h-3/4' />
        </button>
        <button  onClick={()=>denyFriend(request.senderId)} aria-label='deny friend' className='w-8 h-8 bg-red-600 hover:bg-red-700 grid place-items-center rounded-full transition hover:shadow-md'>
            <X className ='font-semibold w-3/4 h-3/4' />
        </button>
    </div>
   ))
   )}
  </>
  )
}

export default FriendRequest