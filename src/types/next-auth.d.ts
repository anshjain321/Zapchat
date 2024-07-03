import type { Session,User } from "next-auth"
import type {JWT} from 'next-auth/jwt'

type UserId = string

declare module 'next-auth/jwt'{
    interface JWT{
        id: string;
    name: string;
    email: string;
    picture: string;
    }
}

declare module 'next-auth'{
    interface Session {
        user: {
          id: string;
          name: string;
          email: string;
          image: string;
        };
      }
    
}