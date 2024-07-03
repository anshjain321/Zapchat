'use client'
import { User } from "lucide-react";
import Link from "next/link";
import { FC ,useEffect,useState} from "react";
import { pusherClient } from "@/lib/pusher";
import { toPusherkey } from "@/lib/utils";
interface FriendRequestsSidebarOptionProps {
    sessionId: string
    initialUnseenRequestCount: number
}

const FriendRequestsSidebarOption: FC<
  FriendRequestsSidebarOptionProps
> = ({sessionId ,initialUnseenRequestCount,
}) => {
    const [unseenrequestcount, setunseenrequestcount] = useState<number>(
        initialUnseenRequestCount
    )
    useEffect(()=>{
      pusherClient.subscribe(toPusherkey(`user:${sessionId}:incoming_friend_requests`))
      pusherClient.subscribe(toPusherkey(`user:${sessionId}:friends`))
      const friendRequestHandler = ( )=>{
          setunseenrequestcount((prev)=> prev+1)
      }
      const addedFriendHandler = ()=>{
        setunseenrequestcount((prev) => prev+1);
      }
      pusherClient.bind('incoming_friend_requests', friendRequestHandler)
      pusherClient.bind('new friend' , addedFriendHandler)
      return ()=>{
          pusherClient.unsubscribe(
              toPusherkey(`user:${sessionId}:incoming_friend_requests`)
          )
          pusherClient.subscribe(toPusherkey(`user:${sessionId}:friends`))
          pusherClient.unbind('incoming_friend_requests' , friendRequestHandler)
          pusherClient.unbind('new friend' , addedFriendHandler)
      }
     },[sessionId])
  
  return (
    <Link
      href="/dashboard/requests"
      className="text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6"
    >
      <User className="h-4 w-4" />
      {/* <div className="text-gray-400 border-gray-200 group-hover:border-indigo-600 group-hover:text-indigo-600 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg borded text-[0.625rem] font-medium bg-white"> </div> */}
      <p className="truncate">Friend requests</p>
      {unseenrequestcount>0 ? (
        <div className="rounded-full w-5 h-5 text-xs flex justify-center items-center text-white bg-indigo-600">{unseenrequestcount}</div>
      ): null}
    </Link>
  );
};
export default FriendRequestsSidebarOption;
