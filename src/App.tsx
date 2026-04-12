/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Problem, ProblemModel, MergedProblem } from './types';
import { getDifficultyColor, getDifficultyColorClass, getDifficultyBgClass } from './utils';
import { Search, Filter, ArrowUpDown, ExternalLink, Loader2 } from 'lucide-react';

const COLORS = ['Gray', 'Brown', 'Green', 'Cyan', 'Blue', 'Yellow', 'Orange', 'Red', 'Unrated'];

export default function App() {
  const [problems, setProblems] = useState<MergedProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set(COLORS));
  const [minRating, setMinRating] = useState<number | ''>('');
  const [maxRating, setMaxRating] = useState<number | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 100;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [problemsRes, modelsRes] = await Promise.all([
          fetch('https://kenkoooo.com/atcoder/resources/problems.json'),
          fetch('https://kenkoooo.com/atcoder/resources/problem-models.json')
        ]);

        if (!problemsRes.ok || !modelsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const problemsData: Problem[] = await problemsRes.json();
        const modelsData: Record<string, ProblemModel> = await modelsRes.json();

        const merged: MergedProblem[] = problemsData.map(p => {
          const model = modelsData[p.id];
          const difficulty = model?.difficulty !== undefined ? Math.round(model.difficulty) : null;
          return {
            ...p,
            difficulty,
            color: getDifficultyColor(difficulty)
          };
        });

        setProblems(merged);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleColor = (color: string) => {
    const next = new Set(selectedColors);
    if (next.has(color)) {
      next.delete(color);
    } else {
      next.add(color);
    }
    setSelectedColors(next);
    setPage(1);
  };

  const filteredAndSortedProblems = useMemo(() => {
    return problems
      .filter(p => {
        if (!selectedColors.has(p.color || 'Unrated')) return false;
        
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          if (!p.name.toLowerCase().includes(term) && !p.contest_id.toLowerCase().includes(term)) {
            return false;
          }
        }

        if (minRating !== '') {
          if (p.difficulty === null || p.difficulty < minRating) return false;
        }
        
        if (maxRating !== '') {
          if (p.difficulty === null || p.difficulty > maxRating) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const diffA = a.difficulty ?? -Infinity;
        const diffB = b.difficulty ?? -Infinity;
        return sortOrder === 'asc' ? diffA - diffB : diffB - diffA;
      });
  }, [problems, selectedColors, searchTerm, minRating, maxRating, sortOrder]);

  const paginatedProblems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredAndSortedProblems.slice(start, start + itemsPerPage);
  }, [filteredAndSortedProblems, page]);

  const totalPages = Math.ceil(filteredAndSortedProblems.length / itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">Loading AtCoder problems...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg shadow-sm border border-red-100">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <h1 className="text-xl font-bold tracking-tight">AtCoder Problem List</h1>
          </div>
          <div className="text-sm text-gray-500 font-medium">
            {filteredAndSortedProblems.length.toLocaleString()} problems found
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Search className="w-4 h-4" /> Search
            </h2>
            <input
              type="text"
              placeholder="Problem name or contest ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Difficulty Color
            </h2>
            <div className="space-y-2.5">
              {COLORS.map(color => (
                <label key={color} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedColors.has(color)}
                    onChange={() => toggleColor(color)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className={`w-3 h-3 rounded-full ${getDifficultyBgClass(color)} ring-1 ring-black/10`} />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{color}</span>
                </label>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <button 
                onClick={() => { setSelectedColors(new Set(COLORS)); setPage(1); }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button 
                onClick={() => { setSelectedColors(new Set()); setPage(1); }}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" /> Rating Range
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minRating}
                onChange={(e) => { setMinRating(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxRating}
                onChange={(e) => { setMaxRating(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-900">Contest</th>
                    <th className="px-6 py-4 font-semibold text-gray-900">Problem</th>
                    <th 
                      className="px-6 py-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors select-none" 
                      onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')}
                    >
                      <div className="flex items-center gap-1">
                        Rating
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-900 text-right">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedProblems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-gray-500">
                        No problems found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedProblems.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3">
                          <a 
                            href={`https://atcoder.jp/contests/${p.contest_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline uppercase font-medium"
                          >
                            {p.contest_id}
                          </a>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-3 h-3 rounded-full ${getDifficultyBgClass(p.color || 'Unrated')} ring-1 ring-black/10 flex-shrink-0`} />
                            <span className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg" title={p.title}>
                              {p.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          {p.difficulty !== null ? (
                            <span className={`font-semibold ${getDifficultyColorClass(p.color || 'Unrated')}`}>
                              {p.difficulty}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <a
                            href={`https://atcoder.jp/contests/${p.contest_id}/tasks/${p.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View Problem"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white sticky bottom-0">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium text-gray-900">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(page * itemsPerPage, filteredAndSortedProblems.length)}</span> of <span className="font-medium text-gray-900">{filteredAndSortedProblems.length}</span> results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

