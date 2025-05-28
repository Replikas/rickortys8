import React, { useState, useEffect } from 'react';
import './index.css';

interface StreamingLink {
  id: number;
  url: string;
  quality: string;
  sourceName: string;
}

interface Episode {
  id: number;
  code: string;
  title: string;
  description: string;
  episodeNumber: number;
  links: StreamingLink[];
}

const API_BASE = '/api';

function SimpleApp() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAddEpisode, setShowAddEpisode] = useState(false);
  const [showAddLink, setShowAddLink] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // New episode form
  const [newEpisode, setNewEpisode] = useState({
    code: '',
    title: '',
    description: '',
    episodeNumber: 1
  });

  // New link form
  const [newLink, setNewLink] = useState({
    url: '',
    quality: '1080p',
    sourceName: ''
  });

  useEffect(() => {
    fetchEpisodes();
  }, []);

  const fetchEpisodes = async () => {
    try {
      const response = await fetch(`${API_BASE}/episodes`);
      const data = await response.json();
      setEpisodes(data);
    } catch (error) {
      console.error('Error fetching episodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchEpisodes = async (query: string) => {
    if (!query.trim()) {
      fetchEpisodes();
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/episodes/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setEpisodes(data);
    } catch (error) {
      console.error('Error searching episodes:', error);
    }
  };

  const addEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/episodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEpisode)
      });
      
      if (response.ok) {
        setNewEpisode({ code: '', title: '', description: '', episodeNumber: 1 });
        setShowAddEpisode(false);
        fetchEpisodes();
        alert('Episode added successfully!');
      }
    } catch (error) {
      console.error('Error adding episode:', error);
      alert('Failed to add episode');
    }
  };

  const addLink = async (e: React.FormEvent, episodeId: number) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/episodes/${episodeId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLink)
      });
      
      if (response.ok) {
        setNewLink({ url: '', quality: '1080p', sourceName: '' });
        setShowAddLink(null);
        fetchEpisodes();
        alert('Link added successfully!');
      }
    } catch (error) {
      console.error('Error adding link:', error);
      alert('Failed to add link');
    }
  };

  const deleteEpisode = async (episodeId: number) => {
    if (!confirm('Are you sure you want to delete this episode?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/admin/episodes/${episodeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminPassword}` }
      });
      
      if (response.ok) {
        fetchEpisodes();
        alert('Episode deleted successfully!');
      } else {
        alert('Failed to delete episode');
      }
    } catch (error) {
      console.error('Error deleting episode:', error);
      alert('Failed to delete episode');
    }
  };

  const deleteLink = async (linkId: number) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/admin/links/${linkId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminPassword}` }
      });
      
      if (response.ok) {
        fetchEpisodes();
        alert('Link deleted successfully!');
      } else {
        alert('Failed to delete link');
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Failed to delete link');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchEpisodes(searchQuery);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-4">Rick & Morty Episodes</h1>
          
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Search episodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 text-black rounded"
            />
            <button type="submit" className="bg-blue-800 px-4 py-2 rounded hover:bg-blue-700">
              Search
            </button>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); fetchEpisodes(); }}
              className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-500"
            >
              Clear
            </button>
          </form>
          
          {/* Admin & Add Episode */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowAddEpisode(true)}
              className="bg-green-600 px-4 py-2 rounded hover:bg-green-500"
            >
              Add Episode
            </button>
            
            {!isAdmin ? (
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="px-3 py-2 text-black rounded"
                />
                <button
                  onClick={() => setIsAdmin(true)}
                  className="bg-red-600 px-4 py-2 rounded hover:bg-red-500"
                >
                  Admin Login
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setIsAdmin(false); setAdminPassword(''); }}
                className="bg-red-600 px-4 py-2 rounded hover:bg-red-500"
              >
                Logout Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {/* Add Episode Modal */}
        {showAddEpisode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h2 className="text-xl font-bold mb-4">Add New Episode</h2>
              <form onSubmit={addEpisode}>
                <div className="mb-4">
                  <label className="block mb-2">Episode Code (e.g., S08E01)</label>
                  <input
                    type="text"
                    value={newEpisode.code}
                    onChange={(e) => setNewEpisode({...newEpisode, code: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Title</label>
                  <input
                    type="text"
                    value={newEpisode.title}
                    onChange={(e) => setNewEpisode({...newEpisode, title: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Description</label>
                  <textarea
                    value={newEpisode.description}
                    onChange={(e) => setNewEpisode({...newEpisode, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded h-24"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Episode Number</label>
                  <input
                    type="number"
                    value={newEpisode.episodeNumber}
                    onChange={(e) => setNewEpisode({...newEpisode, episodeNumber: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500">
                    Add Episode
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddEpisode(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Episodes List */}
        <div className="grid gap-6">
          {episodes.map((episode) => (
            <div key={episode.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">{episode.code}: {episode.title}</h2>
                  <p className="text-gray-600 mt-2">{episode.description}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => deleteEpisode(episode.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500"
                  >
                    Delete Episode
                  </button>
                )}
              </div>
              
              {/* Streaming Links */}
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Streaming Links:</h3>
                {episode.links.length === 0 ? (
                  <p className="text-gray-500">No streaming links available</p>
                ) : (
                  <div className="grid gap-2">
                    {episode.links.map((link) => (
                      <div key={link.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <div>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {link.sourceName} ({link.quality})
                          </a>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => deleteLink(link.id)}
                            className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-500"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Add Link */}
              <div>
                {showAddLink === episode.id ? (
                  <form onSubmit={(e) => addLink(e, episode.id)} className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">Add Streaming Link</h4>
                    <div className="grid gap-2">
                      <input
                        type="url"
                        placeholder="Streaming URL"
                        value={newLink.url}
                        onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                        className="px-3 py-2 border rounded"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Source name (e.g., Netflix, Hulu)"
                        value={newLink.sourceName}
                        onChange={(e) => setNewLink({...newLink, sourceName: e.target.value})}
                        className="px-3 py-2 border rounded"
                        required
                      />
                      <select
                        value={newLink.quality}
                        onChange={(e) => setNewLink({...newLink, quality: e.target.value})}
                        className="px-3 py-2 border rounded"
                      >
                        <option value="480p">480p</option>
                        <option value="720p">720p</option>
                        <option value="1080p">1080p</option>
                        <option value="4K">4K</option>
                      </select>
                      <div className="flex gap-2">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500">
                          Add Link
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddLink(null)}
                          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowAddLink(episode.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
                  >
                    Add Streaming Link
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {episodes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No episodes found</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default SimpleApp;