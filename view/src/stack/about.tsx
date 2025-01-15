import { CodeBracketIcon } from "@heroicons/react/20/solid";
import { forwardRef } from "react";

export const About = forwardRef<HTMLDivElement>((_, ref) =>

    <div ref={ref} id='about' className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 dark:text-white">
      <h2 className="text-lg font-semibold">About</h2>
      <p className="text-lg mb-6 text-gray-700 dark:text-gray-300">
        I built this app because I wanted a tool to help me figure out when to buy or sell stocks based on market trends. It tracks the RSI (Relative Strength Index) and puts marks on a graph to show you the high and low points. Even though I've annotated the graphs with buy/sell, it's not financial advice or anything fancy, just a way to see when might be a good time to make a move on stocks you're interested in.
      </p>

      <h3 className="text-xl font-semibold mb-2">What It Does:</h3>
      <ul className="list-disc pl-5 mb-6 space-y-2 text-gray-700 dark:text-gray-300">
        <li>RSI Tracking: It keeps an eye on the RSI so you can see what's happening with the market.</li>
        <li>Not Advice: I'm not telling you what to do with your money, just showing you what the market's doing.</li>
      </ul>

      <h3 className="text-xl font-semibold mb-2">How It Helps:</h3>
      <p className="text-lg mb-6 text-gray-700 dark:text-gray-300">
        I use it to check when to buy or sell VOO, or to mess around with riskier stuff like TQQQ and SOXL. It's handy if you like to be a bit more active with your investments.
      </p>

      <h3 className="text-xl font-semibold mb-2">Future Plans:</h3>
      <p className="text-lg mb-2 text-gray-700 dark:text-gray-300">I'm thinking about adding some new stuff:</p>
      <ul className="list-disc pl-5 mb-6 space-y-2 text-gray-700 dark:text-gray-300">
        <li>More Analysis: Calculating ROIC vs WACC to give a bit more insight into buy/sell signals.</li>
        <li>More Analysis: Set a rough price target with DCF.</li>
        <li>Watchlists</li>
        <li>ETF Search Tool: A way to find out which ETFs a stock is in.</li>
      </ul>
      <p className="text-lg text-gray-700 dark:text-gray-300">So, financial data APIs (even with a 15-minute delay) are pretty expensive and I have to gatekeep this a bit. If you want to check out lots of tickers, the site will bug you to sign up for a monthly subscription.</p>
      <p className="mt-6 text-center">
        If you find any bugs you should be able to submit a bug report directly, and can also suggest features or ask questions on <a href="https://github.com/edelauna/stock-screener" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"> <CodeBracketIcon className="w-5 h-5 inline-block mx-1"/>GitHub</a>.
      </p>
    </div>)
