import MainStack from "./stack/main"
import './App.css';
import { MarketStatusProvider } from "./context/market-status/market-status.provider";
import { SymbolSearchProvider } from "./context/symbol-search/symbol-search.provider";
import { NavigationProvider } from "./context/navigation/navigation.provider";
import { BrowserRouter } from "react-router";
import { ErrorProvider } from "./context/errors/errors.provider";

function App() {
  return (
    <BrowserRouter>
      <ErrorProvider>
        <NavigationProvider>
          <SymbolSearchProvider>
            <MarketStatusProvider>
              <MainStack />
            </MarketStatusProvider>
          </SymbolSearchProvider>
        </NavigationProvider>
      </ErrorProvider>
    </BrowserRouter>
  );
}

export default App;
