import { useContext, useEffect, useRef } from "react"
import { navigationStore } from "../../../context/navigation/navigation.provider"
import { errorStore } from "../../../context/errors/errors.provider"
import { useNavigate } from "react-router"
import { Add } from "../../../context/errors/errors.actions"
import { RawCustomer, Redirect } from "../../../context/navigation/navigation.actions"

export const useUpdateCustomerDataWithCheckoutId = (checkoutId: string | null) => {
  const {dispatch} = useContext(navigationStore)
  const {dispatch: errorDispatch} = useContext(errorStore)
  const navigate = useNavigate()
  const checkoutIdRef = useRef<string | null>(null)

  useEffect(() => {
    const updateCustomerData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}billing/redirected?checkout_session_id=${checkoutId}`, {
          credentials: 'include'
        })
        if(!response.ok) return errorDispatch(Add({
          header: 'useCustomer::Genrate customer Data response not ok',
          body: await response.text()
        }))
        const { customer_token } = await response.json()
        dispatch(RawCustomer(customer_token))
        navigate("/")
      }catch(e) {
        errorDispatch(Add({
          header: 'useCustomer::Error updating customer data',
          body: (e as Error).message
        }))
      }finally{
        dispatch(Redirect(false))
      }
    }
    if(checkoutId && checkoutId !== checkoutIdRef.current) {
      dispatch(Redirect(true))
      checkoutIdRef.current = checkoutId
      updateCustomerData()
    }
  }, [dispatch, errorDispatch, navigate, checkoutId])
}
