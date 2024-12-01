import MainStack from "./stack/main"
import './App.css';
import { MarketStatusProvider } from "./context/market-status/market-status.provider";
import { SymbolSearchProvider } from "./context/symbol-search/symbol-search.provider";
import { NavigationProvider } from "./context/navigation/navigation.provider";

function App() {
  return (
    <NavigationProvider>
      <SymbolSearchProvider>
        <MarketStatusProvider>
          <MainStack />
        </MarketStatusProvider>
      </SymbolSearchProvider>
    </NavigationProvider>
  );
}

export default App;
