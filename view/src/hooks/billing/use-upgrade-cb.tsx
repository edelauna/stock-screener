import { useCallback, useContext } from "react"
import { navigationStore } from "../../context/navigation/navigation.provider"
import { Redirect } from "../../context/navigation/navigation.actions"

export const useUpgradeCb = () => {
  const {dispatch} = useContext(navigationStore)
  return useCallback(() => {
    if(process.env.REACT_APP_STRIPE_PAYMENT_LINK){
      dispatch(Redirect(true))
      window.location.assign(process.env.REACT_APP_STRIPE_PAYMENT_LINK)
    }
  }, [dispatch])
}
