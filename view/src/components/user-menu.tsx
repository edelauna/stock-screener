import { Button, Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { LoginButton } from "./login-button";
import { useNavigate } from "react-router";
import { useContext } from "react";
import { navigationStore } from "../context/navigation/navigation.provider";
import { useCustomer } from "../hooks/billing/use-customer-hook/use-customer";
import { useManageCb } from "../hooks/billing/use-manage-cb";
import { useUpgradeCb } from "../hooks/billing/use-upgrade-cb";

export const UserMenu = () => {
  const navigate = useNavigate()
  const {state} = useContext(navigationStore)
  const {customer} = useCustomer()
  const manageOnClick = useManageCb()
  const upgradeCb = useUpgradeCb()

  const conditionalCustomerRender = () => customer ?
  <MenuItem key={'Mange'}>
    <Button
      className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none w-full text-left"
      onClick={manageOnClick}
    >
      Manage
    </Button>
  </MenuItem> :
  <MenuItem key={'Upgrade'}>
    <Button
      onClick={upgradeCb}
      className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none w-full text-left"
    >
      Upgrade
    </Button>
  </MenuItem>

  const conditionalUserMenuRender = () => state.identityToken ?
    <MenuItems transition className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in">
      {conditionalCustomerRender()}
      <MenuItem key={'logout'}>
        <Button
          onClick={() => navigate('/logout')}
          className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none w-full text-left"
        >
          Sign out
        </Button>
      </MenuItem>
    </MenuItems> : <></>

  return (
    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">

      {/* Profile dropdown */}
      <Menu as="div" className="relative ml-3">
        <div>
          <MenuButton className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
            <LoginButton />
          </MenuButton>
        </div>
        {conditionalUserMenuRender()}
      </Menu>
    </div>
  );
};
