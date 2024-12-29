import { useContext, useEffect, useState } from "react"
import { navigationStore } from "../../../context/navigation/navigation.provider"
import { errorStore } from "../../../context/errors/errors.provider"
import { Add } from "../../../context/errors/errors.actions"
import { RawCustomer } from "../../../context/navigation/navigation.actions"

export const useUpdateCustomerData = (stale: boolean) => {
  const {dispatch} = useContext(navigationStore)
  const {dispatch: errorDispatch} = useContext(errorStore)
  const [updating, setUpdating] = useState(false)

  // Define the debounced update function using useCallback

  useEffect(() => {
    const updateCustomerData = async () => {
      setUpdating(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}billing/refresh`, {
          credentials: 'include'
        });

        if (!response.ok) {
          errorDispatch(Add({
            header: 'useUpdateCustomerData::updateCustomerData customer Data response not ok',
            body: await response.text()
          }));
          return;
        }

        const { customer_token } = await response.json();

        dispatch(RawCustomer(customer_token));
      } catch (e) {
        errorDispatch(Add({
          header: 'useUpdateCustomerData::Error updating customer data',
          body: (e as Error).message
        }));
      } finally {
        setUpdating(false);
      }
    }
    if (stale) {
      updateCustomerData()
    }

  }, [stale, dispatch, errorDispatch]);

  return { updating }
}
