interface User{
    name:string,
    email: string,
    image:string,
    id: string
}

interface initial_Message{
    id: string,
    senderId: string,
   /*  receiverId: string, */
    text: string,
    timestamp: number,
}
interface Message{
    id: string,
    senderId: string,
    receiverId: string,
    text: string,
    timestamp: number,
}
interface Chat{
    id: string,
    message: Message[],
}

interface FriendRequest{
    id: string,
    senderId: string,
    receiverId: string,   
}