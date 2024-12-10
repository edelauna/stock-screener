import { useCallback, useContext } from "react";
import ComboBox from "./combo-box";
import { store } from "../context/symbol-search/symbol-search.provider";

export const Header = () => {
  const {state} = useContext(store)

  const ctaCB = useCallback(() => {
    if(state.activeSymbol['2. name'] !== ''){
      return state.activeSymbol['2. name']
    } else {
      return "Search"
    }
  }, [state.activeSymbol])
  return (
    <header className="bg-white dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{ctaCB()}</h1>
        <div className="md:ml-auto md:flex-1 md:max-w-md">
          <ComboBox /> {/* Assuming ComboBox is another React component */}
        </div>
      </div>
    </header>
  );
};
