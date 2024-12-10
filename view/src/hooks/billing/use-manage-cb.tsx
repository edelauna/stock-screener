import { useCallback, useContext } from "react"
import { errorStore } from "../../context/errors/errors.provider"
import { Add } from "../../context/errors/errors.actions"
import { Redirect } from "../../context/navigation/navigation.actions"
import { navigationStore } from "../../context/navigation/navigation.provider"

export const useManageCb = () => {
  const {dispatch} = useContext(navigationStore)
  const {dispatch: errorDispatch} = useContext(errorStore)

  const manageOnClick = useCallback(() => {
    const generateSesionURL = async () => {
      const apiUrl = `${process.env.REACT_APP_API_URL}billing/manage`
      try {
        const response = await fetch(apiUrl, {
          credentials: 'include',
          redirect: 'follow',
        })
        if(response.ok){
          const { url } = await response.json()
          window.location = url
        }
      } catch (e){
        errorDispatch(Add({
          header: 'There was an error fetching sessions URL',
          body: (e as Error).message
        }))
      } finally {
        dispatch(Redirect(false))
      }
    }
    dispatch(Redirect(true))
    generateSesionURL()
  }, [dispatch, errorDispatch])

  return manageOnClick
}
