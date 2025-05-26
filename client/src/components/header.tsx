import { Search, Tv } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Header({ searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="bg-space-surface border-b border-space-lighter sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Portal-inspired logo */}
            <div className="w-12 h-12 bg-gradient-to-r from-portal-blue to-rick-green rounded-full flex items-center justify-center">
              <Tv className="text-xl text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Rick & Morty S8</h1>
              <p className="text-sm text-gray-400">Streaming Links Hub</p>
            </div>
          </div>
          
          {/* Search */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search episodes..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-space-lighter border-gray-600 rounded-lg px-4 py-2 pl-10 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-portal-blue focus:border-transparent w-64"
              />
              <Search className="absolute left-3 top-3 text-gray-400 text-sm h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
