import { Button, Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { User } from "../stack/main";
import { UserMenu } from "./user-menu";
import { useContext, useEffect, useState } from "react";
import { NavigationItem, navigationStore } from "../context/navigation/navigation.provider";
import { Navigate } from "../context/navigation/navigation.actions";

function classNames(...classes: (string | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface Props {
  user: User
}

export const NavBar = ({ user }: Props) => {
  const {state, dispatch} = useContext(navigationStore)
  const {navigation} = state
  const [scrollTo, setScrollTo] = useState<NavigationItem>()

  useEffect(() => {
    const handleScroll = (item: NavigationItem) => {
      const element = document.getElementById(item.id);
      const navbarOffset = 60; // Adjust this to the height of your fixed navbar
      if (element) {
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - navbarOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
      dispatch(Navigate(item.id))
    };
    if(scrollTo) handleScroll(scrollTo);
  }, [scrollTo, dispatch]);
     
  return (
    <Disclosure as="nav" className="bg-gray-800 shadow sticky top-0 z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="shrink-0">
              <img alt="Your Company" src="logo.webp" className="size-8" />
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigation.map((item) => (
                  <Button
                    key={item.name}
                    onClick={() => setScrollTo(item)}
                    aria-current={item.current ? 'page' : undefined}
                    className={classNames(
                      item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                      'rounded-md px-3 py-2 text-sm font-medium',
                    )}
                    >
                    {item.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <UserMenu user={user} />
          
          <div className="-mr-2 flex md:hidden">
            {/* Mobile menu button */}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-[open]:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-[open]:block" />
            </DisclosureButton>
          </div>
        </div>
      </div>
      
      <DisclosurePanel className="md:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
          {navigation.map((item) => (
            <DisclosureButton
              key={item.name}
              as="a"
              onClick={() => setScrollTo(item)}
              aria-current={item.current ? 'page' : undefined}
              className={classNames(
                item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                'block rounded-md px-3 py-2 text-base font-medium',
              )}
            >
              {item.name}
            </DisclosureButton>
          ))}
        </div>
        <div className="border-t border-gray-700 pb-3 pt-4">
              <div className="flex items-center px-5">
                <div className="shrink-0">
                  <img alt="" src={user.imageUrl} className="size-10 rounded-full" />
                </div>
                <div className="ml-3">
                  <div className="text-base/5 font-medium text-white">{user.name}</div>
                  <div className="text-sm font-medium text-gray-400">{user.email}</div>
                </div>
                <button
                  type="button"
                  className="relative ml-auto shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">View notifications</span>
                  <BellIcon aria-hidden="true" className="size-6" />
                </button>
              </div>
              <div className="mt-3 space-y-1 px-2">
                {user.userNavigation.map((item) => (
                  <DisclosureButton
                    key={item.name}
                    as="a"
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                  >
                    {item.name}
                  </DisclosureButton>
                ))}
              </div>
            </div>
      </DisclosurePanel>
    </Disclosure>
  );
};