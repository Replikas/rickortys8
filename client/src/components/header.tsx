import { Search, Tv } from "lucide-react";
import { Input } from "@/components/ui/input";
import bannerImage from "@assets/v43GMpAuUdC6RabdnuVVMN.png";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Header({ searchQuery, onSearchChange }: HeaderProps) {
  return (
    <>
      {/* Season 8 Banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-space-dark to-space-surface">
        <img 
          src={bannerImage} 
          alt="Rick and Morty Season 8" 
          className="w-full h-48 md:h-64 object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 md:left-8">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-2xl" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.8)'}}>
            Rick & Morty
          </h1>
          <p className="text-lg md:text-xl text-yellow-400 font-bold drop-shadow-2xl" style={{textShadow: '2px 2px 6px rgba(0,0,0,0.9), 0 0 15px rgba(0,0,0,0.8)'}}>
            Season 8 • Streaming Hub
          </p>
        </div>
      </div>

      {/* Floating Message */}
      <div className="relative mt-4 z-30 mx-4 md:mx-8 animate-in slide-in-from-top-4 fade-in duration-700">
        <div className="bg-gradient-to-r from-portal-blue/90 to-rick-green/90 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20 shadow-lg animate-pulse">
          <p className="text-white text-sm md:text-base font-medium text-center animate-in fade-in duration-1000 delay-300">
            <span className="inline-block animate-bounce mr-2">📺</span>
            <span className="animate-in slide-in-from-left-2 duration-800 delay-500">
              Links will be uploaded after the episode aired on Adult Swim every Sunday
            </span>
          </p>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="bg-space-surface border-b border-space-lighter sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Portal-inspired logo */}
              <div className="w-12 h-12 bg-gradient-to-r from-portal-blue to-rick-green rounded-full flex items-center justify-center">
                <Tv className="text-xl text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Episode Library</h2>
                <p className="text-sm text-gray-400">Find your favorite episodes</p>
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
    </>
  );
}
