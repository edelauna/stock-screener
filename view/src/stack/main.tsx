import { Chart } from '../components/chart';
import { useContext, useRef } from 'react';
import { store } from '../context/symbol-search/symbol-search.provider';
import { About } from './about';
import { Header } from '../components/header';
import { NavBar } from '../components/nav-bar';
import { SimpleNavigationItem } from '../context/navigation/navigation.provider';
import { useObserver } from '../hooks/navigation/use-observer';

export interface User {
  name: string;
  email: string;
  imageUrl: string;
  userNavigation: SimpleNavigationItem[]
}

const userNavigation: SimpleNavigationItem[] = [
  { name: 'Your Profile' },
  { name: 'Settings' },
  { name: 'Sign out' },
];

const user: User = {
  name: 'Tom Cook',
  email: 'tom@example.com',
  imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  userNavigation: userNavigation
};

const Main = () => {
  const {state} = useContext(store)
  const aboutRef = useObserver(useRef(null))
  const homeRef = useObserver(useRef(null))
  return (
    <div ref={homeRef} className="min-h-full" id='home'>
      <NavBar user={user} />
      <Header />
      <main>
        <div className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${state.activeSymbol['1. symbol'] !== '' ? '' : 'hidden'}`}>
          <Chart />
        </div>
        <About ref={aboutRef} />
      </main>
    </div>
  );
}

export default Main;