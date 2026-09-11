import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Stack, Typography } from "@mui/material"
import { checkAuthAsync, selectLoggedInUser } from "../AuthSlice"

/**
 * Pages that need a user wait for one instead of redirecting to a login page.
 * With no session, checkAuth starts a guest session, so a shopper goes
 * straight to the shop.
 */
export const Protected = ({children}) => {
    const dispatch=useDispatch()
    const loggedInUser=useSelector(selectLoggedInUser)
    const status=useSelector((state)=>state.AuthSlice.status)

    useEffect(()=>{
        if(!loggedInUser) dispatch(checkAuthAsync())
    },[loggedInUser,dispatch])

    if(loggedInUser?.isVerified){
        return children
    }

    if(status==='rejected'){
        return (
            <Stack height="100vh" alignItems="center" justifyContent="center" gap={1} px={2} textAlign="center">
                <Typography variant="h6">The shop can't be reached right now</Typography>
                <Typography color="text.secondary">Check that the API is running on port 8000, then reload the page.</Typography>
            </Stack>
        )
    }

    return null
}
