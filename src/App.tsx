/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Problem, ProblemModel, MergedProblem } from './types';
import { getDifficultyColor, getDifficultyColorClass, getDifficultyColorHex, getHexByColorName } from './utils';
import { Search, Filter, ArrowUpDown, Loader2, RefreshCw, CheckCircle2, Bookmark, BookmarkCheck, ListTodo, Trophy, Plus, FolderPlus, FolderOpen, Trash2, X } from 'lucide-react';
import Calendar from './Calendar';

const COLORS = ['Gray', 'Brown', 'Green', 'Cyan', 'Blue', 'Yellow', 'Orange', 'Red', 'Unrated'];

interface CustomList {
  id: string;
  name: string;
  problems: string[];
}

const DifficultyCircle = ({ difficulty }: { difficulty: number | null }) => {
  if (difficulty === null) {
    return <span className="w-3.5 h-3.5 rounded-full border border-gray-400 bg-gray-400 inline-block flex-shrink-0" />;
  }
  
  let fillPercent = 0;
  if (difficulty >= 3200) {
    fillPercent = 100;
  } else if (difficulty > 0) {
    fillPercent = (difficulty % 400) / 400 * 100;
  }
  
  const hex = getDifficultyColorHex(difficulty);
  
  return (
    <span 
      className="w-3.5 h-3.5 rounded-full border inline-block flex-shrink-0" 
      style={{
        borderColor: hex,
        background: `linear-gradient(to top, ${hex} ${fillPercent}%, transparent ${fillPercent}%)`
      }}
    />
  );
};

export default function App() {
  const [problems, setProblems] = useState<MergedProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set(COLORS));
  const [minRating, setMinRating] = useState<number | ''>('');
  const [maxRating, setMaxRating] = useState<number | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [username, setUsername] = useState(() => localStorage.getItem('atcoder_username') || '');
  const [solvedProblems, setSolvedProblems] = useState<Set<string>>(new Set());
  const [dailyCounts, setDailyCounts] = useState<Record<string, number>>({});
  const [isFetchingUser, setIsFetchingUser] = useState(false);

  const [activeTab, setActiveTab] = useState<'list' | 'calendar' | 'todo' | 'custom'>('list');
  const [todoList, setTodoList] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('atcoder_todo_list');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  const [customLists, setCustomLists] = useState<CustomList[]>(() => {
    const saved = localStorage.getItem('atcoder_custom_lists');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentCustomListId, setCurrentCustomListId] = useState<string | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [problemToAdd, setProblemToAdd] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');

  const [page, setPage] = useState(1);
  const itemsPerPage = 100;

  useEffect(() => {
    localStorage.setItem('atcoder_username', username);
  }, [username]);

  useEffect(() => {
    localStorage.setItem('atcoder_todo_list', JSON.stringify(Array.from(todoList)));
  }, [todoList]);

  useEffect(() => {
    localStorage.setItem('atcoder_custom_lists', JSON.stringify(customLists));
  }, [customLists]);

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

  const toggleTodo = (id: string) => {
    setTodoList(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAddModal = (id: string) => {
    setProblemToAdd(id);
    setIsAddModalOpen(true);
  };

  const createListAndAddProblem = () => {
    if (!newListName.trim() || !problemToAdd) return;
    const newList: CustomList = {
      id: Date.now().toString(),
      name: newListName.trim(),
      problems: [problemToAdd]
    };
    setCustomLists(prev => [...prev, newList]);
    setNewListName('');
    setIsAddModalOpen(false);
    setProblemToAdd(null);
  };

  const toggleProblemInCustomList = (listId: string, problemId: string) => {
    setCustomLists(prev => prev.map(list => {
      if (list.id !== listId) return list;
      const exists = list.problems.includes(problemId);
      return {
        ...list,
        problems: exists ? list.problems.filter(id => id !== problemId) : [...list.problems, problemId]
      };
    }));
  };

  const deleteCustomList = (listId: string) => {
    setCustomLists(prev => prev.filter(l => l.id !== listId));
    if (currentCustomListId === listId) {
      setCurrentCustomListId(null);
    }
  };

  const fetchUserSubmissions = async () => {
    if (!username.trim()) return;
    setIsFetchingUser(true);
    try {
      // We fetch all submissions for the user. This is the most efficient way to check 
      // AC status for all filtered problems at once using the AtCoder Problems API.
      const res = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${username.trim()}&from_second=0`);
      if (!res.ok) throw new Error('Failed to fetch submissions');
      
      const submissions = await res.json();
      const solved = new Set<string>();
      const firstAcMap = new Map<string, number>();
      
      submissions.forEach((sub: any) => {
        if (sub.result === 'AC') {
          solved.add(sub.problem_id);
          const current = firstAcMap.get(sub.problem_id);
          if (!current || sub.epoch_second < current) {
            firstAcMap.set(sub.problem_id, sub.epoch_second);
          }
        }
      });
      
      const counts: Record<string, number> = {};
      firstAcMap.forEach((epoch_second) => {
        const date = new Date(epoch_second * 1000);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      });
      
      setSolvedProblems(solved);
      setDailyCounts(counts);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch user submissions. Please check the username and try again.');
    } finally {
      setIsFetchingUser(false);
    }
  };

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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">AtCoder Problem List</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <input
              type="text"
              placeholder="AtCoder Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUserSubmissions()}
              className="w-32 sm:w-48 px-2 sm:px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={fetchUserSubmissions}
              disabled={isFetchingUser || !username.trim()}
              className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isFetchingUser ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />}
              <span className="hidden sm:inline">{isFetchingUser ? 'Checking...' : 'Check AC'}</span>
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('list')}
            className={`py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'list' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Problem List
          </button>
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'calendar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Calendar
          </button>
          <button 
            onClick={() => setActiveTab('todo')}
            className={`py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'todo' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            To-Do Tasks
            {todoList.size > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {todoList.size}
              </span>
            )}
          </button>
          <button 
            onClick={() => { setActiveTab('custom'); setCurrentCustomListId(null); }}
            className={`py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'custom' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Custom Problemsets
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'list' ? (
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-64 flex-shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
                <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200">
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

                <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200">
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
                  <span 
                    className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10 flex-shrink-0" 
                    style={{ backgroundColor: getHexByColorName(color) }}
                  />
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

                <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200">
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
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-900 w-20 sm:w-24">Status</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-900">Problem</th>
                        <th 
                          className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors select-none w-24 sm:w-32" 
                          onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')}
                        >
                      <div className="flex items-center gap-1">
                        Rating
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-900 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedProblems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 sm:px-6 sm:py-16 text-center text-gray-500">
                        No problems found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedProblems.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 sm:px-6 sm:py-3">
                          {solvedProblems.has(p.id) ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md bg-green-50 text-green-700 text-[10px] sm:text-xs font-medium border border-green-200">
                              <CheckCircle2 className="w-3 h-3" /> AC
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs pl-2">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 sm:px-6 sm:py-3">
                          <div className="flex items-center gap-2 sm:gap-2.5">
                            <DifficultyCircle difficulty={p.difficulty} />
                            <a 
                              href={`https://atcoder.jp/contests/${p.contest_id}/tasks/${p.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`font-medium hover:underline truncate max-w-[160px] sm:max-w-xs md:max-w-md lg:max-w-lg text-sm ${solvedProblems.has(p.id) ? 'text-green-600' : 'text-blue-600'}`}
                              title={p.title}
                            >
                              {p.title}
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 sm:px-6 sm:py-3">
                          {p.difficulty !== null ? (
                            <span className={`font-semibold ${getDifficultyColorClass(p.color || 'Unrated')}`}>
                              {p.difficulty}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 sm:px-6 sm:py-3 text-center">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button 
                              onClick={() => toggleTodo(p.id)}
                              className={`p-1.5 rounded-md transition-colors ${todoList.has(p.id) ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-gray-100'}`}
                              title={todoList.has(p.id) ? "Remove from To-Do" : "Add to To-Do"}
                            >
                              {todoList.has(p.id) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => openAddModal(p.id)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Add to Custom Problemset"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white sticky bottom-0">
                  <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                    Showing <span className="font-medium text-gray-900">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(page * itemsPerPage, filteredAndSortedProblems.length)}</span> of <span className="font-medium text-gray-900">{filteredAndSortedProblems.length}</span> results
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        ) : activeTab === 'calendar' ? (
          <Calendar dailyCounts={dailyCounts} username={username} />
        ) : activeTab === 'custom' ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <aside className="w-full lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-indigo-600" /> My Problemsets
                  </h2>
                </div>
                <div className="p-2 space-y-1 max-h-[300px] lg:max-h-[500px] overflow-y-auto">
                  {customLists.map(list => (
                    <div 
                      key={list.id}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${currentCustomListId === list.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100 text-gray-700'}`}
                      onClick={() => setCurrentCustomListId(list.id)}
                    >
                      <span className="font-medium truncate flex-1">{list.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded-md ${currentCustomListId === list.id ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 text-gray-600'}`}>{list.problems.length}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteCustomList(list.id); }}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {customLists.length === 0 && (
                    <div className="px-3 py-6 text-center text-sm text-gray-500">
                      No problemsets yet.<br />Click '+' on a problem to create one!
                    </div>
                  )}
                </div>
              </div>
            </aside>
            <div className="flex-1 min-w-0">
              {currentCustomListId ? (() => {
                const activeList = customLists.find(l => l.id === currentCustomListId);
                if (!activeList) return null;
                const listProblems = problems.filter(p => activeList.problems.includes(p.id));
                return (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{activeList.name}</h2>
                        <p className="text-sm text-gray-500 mt-1">{listProblems.length} {listProblems.length === 1 ? 'problem' : 'problems'}</p>
                      </div>
                    </div>
                    {listProblems.length === 0 ? (
                      <div className="p-12 text-center text-gray-500">
                        <FolderPlus className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-1">This list is empty</p>
                        <p className="text-sm">Go to the Problem List and add some problems here.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-900 w-20 sm:w-24">Status</th>
                              <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-900">Problem</th>
                              <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-900 w-24 sm:w-32">Rating</th>
                              <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-900 w-16 text-center">Remove</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {listProblems.map(p => (
                              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-2.5 sm:px-6 sm:py-3">
                                  {solvedProblems.has(p.id) ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md bg-green-50 text-green-700 text-[10px] sm:text-xs font-medium border border-green-200">
                                      <CheckCircle2 className="w-3 h-3" /> AC
                                    </span>
                                  ) : (
                                    <span className="text-gray-300 text-xs pl-2">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 sm:px-6 sm:py-3">
                                  <div className="flex items-center gap-2 sm:gap-2.5">
                                    <DifficultyCircle difficulty={p.difficulty} />
                                    <a 
                                      href={`https://atcoder.jp/contests/${p.contest_id}/tasks/${p.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`font-medium hover:underline truncate max-w-[160px] sm:max-w-xs md:max-w-md lg:max-w-lg text-sm ${solvedProblems.has(p.id) ? 'text-green-600' : 'text-blue-600'}`}
                                      title={p.title}
                                    >
                                      {p.title}
                                    </a>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 sm:px-6 sm:py-3">
                                  {p.difficulty !== null ? (
                                    <span className={`font-semibold ${getDifficultyColorClass(p.color || 'Unrated')}`}>
                                      {p.difficulty}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 sm:px-6 sm:py-3 text-center">
                                  <button 
                                    onClick={() => toggleProblemInCustomList(activeList.id, p.id)}
                                    className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
                                    title="Remove from list"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })() : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <FolderOpen className="w-8 h-8 text-indigo-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">No Problemset Selected</h3>
                  <p className="text-gray-500 max-w-sm mt-2">Select a problemset from the sidebar to view its problems, or go to the Problem List to create a new one.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <ListTodo className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">To-Do List</h2>
                <p className="text-sm text-gray-500">Track specific problems you want to solve</p>
              </div>
            </div>

            {todoList.size > 0 && Array.from(todoList).every(id => solvedProblems.has(id)) && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-4 shadow-sm">
                <div className="p-2 bg-green-100 text-green-600 rounded-full">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-green-800 font-bold text-lg">Congratulations!</h3>
                  <p className="text-green-700 text-sm">You have successfully AC'd all problems in your To-Do list.</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {todoList.size === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <ListTodo className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-1">Your To-Do list is empty</p>
                  <p className="text-sm">Go to the Problem List and click the bookmark icon to add problems here.</p>
                  <button 
                    onClick={() => setActiveTab('list')}
                    className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    Browse Problems
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-900 w-20 sm:w-24">Status</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-900">Problem</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-900 w-24 sm:w-32">Rating</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-900 w-16 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {problems.filter(p => todoList.has(p.id)).map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 sm:px-6 sm:py-3">
                            {solvedProblems.has(p.id) ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md bg-green-50 text-green-700 text-[10px] sm:text-xs font-medium border border-green-200">
                                <CheckCircle2 className="w-3 h-3" /> AC
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs pl-2">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 sm:px-6 sm:py-3">
                            <div className="flex items-center gap-2 sm:gap-2.5">
                              <DifficultyCircle difficulty={p.difficulty} />
                              <a 
                                href={`https://atcoder.jp/contests/${p.contest_id}/tasks/${p.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`font-medium hover:underline truncate max-w-[160px] sm:max-w-xs md:max-w-md lg:max-w-lg text-sm ${solvedProblems.has(p.id) ? 'text-green-600' : 'text-blue-600'}`}
                                title={p.title}
                              >
                                {p.title}
                              </a>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 sm:px-6 sm:py-3">
                            {p.difficulty !== null ? (
                              <span className={`font-semibold ${getDifficultyColorClass(p.color || 'Unrated')}`}>
                                {p.difficulty}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 sm:px-6 sm:py-3 text-center">
                            <button 
                              onClick={() => toggleTodo(p.id)}
                              className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
                              title="Remove from To-Do"
                            >
                              <BookmarkCheck className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add to Custom List Modal */}
      {isAddModalOpen && problemToAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900">Add to Custom List</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              {customLists.length > 0 ? (
                <div className="space-y-2 mb-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Lists</p>
                  {customLists.map(list => {
                    const hasProblem = list.problems.includes(problemToAdd);
                    return (
                      <button
                        key={list.id}
                        onClick={() => toggleProblemInCustomList(list.id, problemToAdd)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${hasProblem ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
                      >
                        <span className={`font-medium text-sm ${hasProblem ? 'text-indigo-900' : 'text-gray-700'}`}>{list.name}</span>
                        {hasProblem ? (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Plus className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : null}

              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Create New List</p>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="E.g. DP Problems"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createListAndAddProblem()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button 
                    onClick={createListAndAddProblem}
                    disabled={!newListName.trim()}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

