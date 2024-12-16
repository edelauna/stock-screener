import { useContext, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { errorStore } from "../../errors/errors.provider"
import { Add } from "../../errors/errors.actions"

export const useLogout = (rawIdentityToken: string) => {
  const {dispatch: errorDispatch} = useContext(errorStore)
  const [loggingOut, setLoggingOut] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const doLogout = async (idToken: string) => {
      const url = `${process.env.REACT_APP_API_URL}auth/logout`
      try {
        const response = await fetch(url, {
          credentials: 'include',
          redirect: 'follow',
          headers: {
            'Content-Type' : 'application/json'
          },
          method: 'POST',
          body: JSON.stringify({ id_token: idToken}),
        })
        const {redirect_uri} = await response.json()
        window.location = redirect_uri
      } catch (e){
        errorDispatch(Add({
          header: 'useAuth::There was an error fetching token',
          body: (e as Error).message
        }))
      } finally {
        navigate('/')
        setLoggingOut(false)
      }
    }

    if(location.pathname.split('/')[1] === 'logout' && rawIdentityToken !== ''){
      setLoggingOut(true)
      doLogout(rawIdentityToken)
    }
  }, [location, navigate, rawIdentityToken, errorDispatch])

  return {loggingOut}
}
