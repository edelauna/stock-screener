import { useContext, useEffect, useState } from "react"
import { useLocation } from "react-router"
import { useUpdateCustomerDataWithCheckoutId } from "./use-update-customer-data-with-checkout-id"
import { useUpdateCustomerData } from "./use-update-customer-data"
import { navigationStore } from "../../../context/navigation/navigation.provider"

export const useUpdateCustomer = () => {
  const location = useLocation()
  const [checkoutId, setCheckoutId] = useState<string | null>(null)
  const {state} = useContext(navigationStore)
  const [stale, setStale] = useState(false)
  const [navigationType] = useState(
    (window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).type
  )

  useUpdateCustomerDataWithCheckoutId(checkoutId)

  useEffect(() => {
    if(location.pathname.startsWith('/checkout_redirected')){
      const search = new URLSearchParams(location.search)
      const checkoutId = search.get('checkout_session_id')
      setCheckoutId(checkoutId)
    }
    else if(location.pathname.startsWith('/managed_redirected') && state.rawCustomerToken){
      setStale(true)
    }
  }, [location, state.rawCustomerToken])

  const { updating } = useUpdateCustomerData(stale)

  useEffect(() => {
    if(!updating && stale) setStale(false)
  },[updating, stale])

  useEffect(() => {
    if(state.rawCustomerToken !== '' && navigationType === 'back_forward') setStale(true)
  }, [state.rawCustomerToken, navigationType])
}
