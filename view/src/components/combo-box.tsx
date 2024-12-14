import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import { useContext, useState } from 'react';
import { SymbolSearchResult, useSymbolSearch } from '../hooks/use-symbol-search';
import { store } from '../context/symbol-search/symbol-search.provider';
import { UpdateActiveSymbol } from '../context/symbol-search/symbol-search.actions';

export default function Example() {
  const {state, dispatch} = useContext(store)
  const [query, setQuery] = useState<string>('');
  const [selected, setSelected] = useState<SymbolSearchResult |null>(state.activeSymbol);

  const {data} = useSymbolSearch(query)

  return (
    <div className="mx-auto w-52">
      <Combobox value={selected} onChange={(value: SymbolSearchResult | null) => {
        setSelected(value)
        if(value) dispatch(UpdateActiveSymbol(value))
      }}>
        <div className="relative">
          <ComboboxInput
            className={clsx(
              'w-full rounded-lg border border-gray-300 bg-white py-1.5 pr-8 pl-3 text-base text-gray-800',
              'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            )}
            displayValue={(ticker: SymbolSearchResult) => ticker?.['1. symbol']}
            onChange={(event) => setQuery(event.target.value)}
          />
          <ComboboxButton className="group absolute inset-y-0 right-0 px-2.5">
            {
              data.length > 0 ?
                <ChevronDownIcon className="h-4 w-4 text-gray-600 group-hover:text-blue-500" /> :
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-600 group-hover:text-blue-500" />}
          </ComboboxButton>
        </div>

        <ComboboxOptions
          anchor="bottom"
          transition
          className={clsx(
            'w-[var(--input-width)] rounded-xl border border-gray-300 bg-white z-50 p-1 [--anchor-gap:var(--spacing-1)] empty:invisible',
            'transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0'
          )}
        >
          {data.map((ticker) => (
            <ComboboxOption
              key={ticker?.['1. symbol']}
              value={ticker}
              className={({ focus }) =>
                `group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none ${focus ? 'bg-blue-500 text-white' : 'text-gray-800'}`
              }
            >
              <CheckIcon className="invisible h-4 w-4 fill-current text-white group-data-[selected]:visible" />
              <div className="text-sm text-gray-800">{`${ticker?.['2. name']} (${ticker?.['1. symbol']})`}</div>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
