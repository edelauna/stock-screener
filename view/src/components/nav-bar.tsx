import { Button, Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { UserMenu } from "./user-menu";
import { useContext, useEffect, useState } from "react";
import { NavigationItem, navigationStore } from "../context/navigation/navigation.provider";
import { Navigate } from "../context/navigation/navigation.actions";

function classNames(...classes: (string | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const NavBar = () => {
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
    <Disclosure as="nav" className="bg-gray-800 fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button*/}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon data-testid="bars-icon" aria-hidden="true" className="block size-6 group-data-[open]:hidden" />
              <XMarkIcon data-testid="x-icon" aria-hidden="true" className="hidden size-6 group-data-[open]:block" />
            </DisclosureButton>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center">
              <img
                alt="Lokeel"
                src="logo.webp"
                className="h-8 w-auto"
              />
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
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

          <UserMenu />
        </div>
      </div>

      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
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
      </DisclosurePanel>
    </Disclosure>
  );
};
