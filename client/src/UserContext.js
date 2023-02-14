import {createContext, useEffect, useState} from "react";
import axios from "axios";
import {data} from "autoprefixer";

export const UserContext = createContext({});
const BASE_URL = "https://booking-app-backend-production-0ead.up.railway.app";

export function UserContextProvider({children}) {
  const [user,setUser] = useState(null);
  // from login we get all data of user in setuser that change the value of user
  const [ready,setReady] = useState(false);
  // we use effect because whenver someone referesh page if he is log in than we get all data
  // use set ready because first user is null than it jump to account nav fast we have to slow down this
  useEffect(() => {
    if (!user) {
      axios.get(`${BASE_URL}/profile`).then(({data}) => {
        setUser(data);
        setReady(true);
      });
    }
  }, []);
  return (
    <UserContext.Provider value={{user,setUser,ready}}>
      {children}
    </UserContext.Provider>
  );
}