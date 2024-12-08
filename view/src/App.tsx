import MainStack from "./stack/main"
import './App.css';
import { MarketStatusProvider } from "./context/market-status/market-status.provider";
import { SymbolSearchProvider } from "./context/symbol-search/symbol-search.provider";
import { NavigationProvider } from "./context/navigation/navigation.provider";
import { BrowserRouter } from "react-router";

function App() {
  return (
    <BrowserRouter>
      <NavigationProvider>
        <SymbolSearchProvider>
          <MarketStatusProvider>
            <MainStack />
          </MarketStatusProvider>
        </SymbolSearchProvider>
      </NavigationProvider>
    </BrowserRouter>
  );
}

export default App;
