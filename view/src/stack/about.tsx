import { CodeBracketIcon } from "@heroicons/react/20/solid";
import { forwardRef } from "react";

export const About = forwardRef<HTMLDivElement>((_, ref) =>

    <div ref={ref} id='about' className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 dark:text-white">
      <h2 className="text-lg font-semibold">About</h2>
      <p className="mt-2">
        Check out the project on <a href="https://github.com/yourusername/your-repo-name" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"> <CodeBracketIcon className="w-5 h-5 inline-block mx-1"/>GitHub</a>.
      </p>
    </div>)
