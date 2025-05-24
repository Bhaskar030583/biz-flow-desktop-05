
import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-600" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-600" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl min-w-[160px]"
      >
        <DropdownMenuItem 
          onClick={() => setTheme("light")} 
          className={`cursor-pointer py-3 px-4 hover:bg-amber-50 dark:hover:bg-amber-950/20 ${theme === 'light' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300' : ''}`}
        >
          <Sun className="mr-3 h-4 w-4 text-amber-600" />
          <span className="font-medium">Light Mode</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")} 
          className={`cursor-pointer py-3 px-4 hover:bg-blue-50 dark:hover:bg-blue-950/20 ${theme === 'dark' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300' : ''}`}
        >
          <Moon className="mr-3 h-4 w-4 text-blue-600" />
          <span className="font-medium">Dark Mode</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")} 
          className={`cursor-pointer py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${theme === 'system' ? 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : ''}`}
        >
          <Monitor className="mr-3 h-4 w-4 text-gray-600" />
          <span className="font-medium">System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
