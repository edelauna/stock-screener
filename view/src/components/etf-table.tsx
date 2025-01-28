import React, { useMemo, useState } from 'react';
import { useEtfHoldings } from '../hooks/use-etfs-holdings/use-etfs-holdings';

export const EtfTable = () => {
  const {data} = useEtfHoldings()
  const rows = useMemo(() => data?.length > 0 ? data.sort((a,b) => parseFloat(b.weighting) - parseFloat(a.weighting)) : [], [data] )
  const maxPage = Math.floor((rows.length - 1) / 10)
  const [page, setPage] = useState(0)
  const [accordionOpen, setAccordionOpen] = useState(false)

  const generatePages = () => {
    const el: React.ReactNode[] = []
    if(page - 1 > 0) el.push(<li><button onClick={()=>setPage(page-3)} aria-current="page" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">...</button></li>)
    for(let i = page - 1; i < page + 2; i++){
      const handler = () => setPage(i)
      if(i < 0) continue;
      if(i > maxPage) continue;
      el.push(
        (i === page) ? 
          <li><button onClick={handler} aria-current="page"  className="flex items-center justify-center px-3 h-8 text-blue-600 border border-gray-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white">{i}</button></li>
        :
        <li><button onClick={handler} className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">{i}</button></li>
      )
    }
    if(page + 2 < maxPage) el.push(<li><button onClick={()=>setPage(page+3)} aria-current="page" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">...</button></li>)
    return el
  }
  if(rows.length === 0) return <></>
 
  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      <button 
    className="flex items-center justify-between w-full px-6 py-4 text-left text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 focus:outline-none"
    onClick={() => setAccordionOpen(!accordionOpen)}
  >
    <span className="text-sm font-medium">Held by the Following Etfs</span>
    <svg 
      className={`w-6 h-6 transition-transform ${accordionOpen ? 'rotate-180' : ''}`}
      fill="currentColor" 
      viewBox="0 0 20 20" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  </button>

  {/* Accordion content */}
  <div 
    className={`overflow-hidden transition-all duration-300 ${accordionOpen ? 'max-h-110vh' : 'max-h-0'}`}
  >
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">ETF</th>
            <th scope="col" className="px-6 py-3">Weighting</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(page * 10, page * 10 + 10).map((r) => (
            <tr key={r.etf_symbol} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{r.etf_symbol}</th>
              <td className="px-6 py-4">{r.weighting}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <nav className="flex items-center flex-column flex-wrap md:flex-row justify-between pt-4" aria-label="Table navigation">
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mb-4 md:mb-0 block w-full md:inline md:w-auto">
          Showing <span className="font-semibold text-gray-900 dark:text-white">{page * 10 + 1}-{Math.min(page * 10 + 10, rows.length)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{rows.length}</span>
        </span>
        <ul className="inline-flex -space-x-px rtl:space-x-reverse text-sm h-8">
          <li>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
              Previous
              </button>
          </li>
          {generatePages()}
          <li>
            <button disabled={page === maxPage} onClick={() => setPage(p => p + 1)} className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
              Next</button>
          </li>
        </ul>
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mb-4 md:mb-0 block w-full md:inline md:w-auto">
          Updated 7am UTC Monday-Friday
        </span>
      </nav>
    </div>
    </div>
  );
};