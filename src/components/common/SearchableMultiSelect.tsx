import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Plus, ChevronDown, Check } from 'lucide-react';
import { OptionGroup } from '../../constants/internshipOptions';

interface SearchableMultiSelectProps {
  label: string;
  groups: OptionGroup[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  allowCustom?: boolean;
  customPlaceholder?: string;
}

export const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  label,
  groups,
  selectedValues,
  onChange,
  placeholder = 'Search and select options...',
  allowCustom = true,
  customPlaceholder = 'Add custom entry...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customInput, setCustomInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter((v) => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const removeOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== option));
  };

  const addCustomOption = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (trimmed && !selectedValues.includes(trimmed)) {
      onChange([...selectedValues, trimmed]);
      setCustomInput('');
    }
  };

  // Filter groups according to search
  const filteredGroups = groups
    .map((group) => {
      const filteredOptions = group.options.filter((opt) =>
        opt.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return {
        category: group.category,
        options: filteredOptions,
      };
    })
    .filter((group) => group.options.length > 0);

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="block text-xs font-medium text-slate-300">
        {label}
        {selectedValues.length > 0 && (
          <span className="ml-2 text-[11px] text-indigo-400 font-normal">
            ({selectedValues.length} selected)
          </span>
        )}
      </label>

      {/* Selected Chips Area */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950/80 border border-slate-800 rounded-lg max-h-28 overflow-y-auto">
          {selectedValues.map((val) => (
            <span
              key={val}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-medium animate-in fade-in"
            >
              <span>{val}</span>
              <button
                type="button"
                onClick={(e) => removeOption(val, e)}
                className="hover:text-red-400 p-0.5 rounded-full transition cursor-pointer"
                aria-label={`Remove ${val}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown Toggle & Search Input */}
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-lg text-sm text-slate-300 cursor-pointer transition shadow-sm"
        >
          <span className="text-xs text-slate-400 truncate">
            {selectedValues.length === 0 ? placeholder : 'Click to add more options...'}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2.5 max-h-80 overflow-hidden flex flex-col backdrop-blur-md">
            {/* Search Filter Box */}
            <div className="relative mb-2 shrink-0">
              <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories or keywords..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            {/* Custom Option Input */}
            {allowCustom && (
              <form onSubmit={addCustomOption} className="flex gap-1.5 mb-2 pb-2 border-b border-slate-800 shrink-0">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={customPlaceholder}
                  className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!customInput.trim()}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium rounded-md flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            )}

            {/* Option Categories List */}
            <div className="overflow-y-auto space-y-3 pr-1 text-xs divide-y divide-slate-800/60">
              {filteredGroups.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-xs">
                  No matching options found. Use the box above to add a custom entry.
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <div key={group.category} className="pt-2 first:pt-0 space-y-1">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block px-1">
                      {group.category}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {group.options.map((option) => {
                        const isSelected = selectedValues.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleOption(option)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded text-left transition cursor-pointer text-xs ${
                              isSelected
                                ? 'bg-indigo-600/25 text-indigo-200 border border-indigo-500/40 font-medium'
                                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                            }`}
                          >
                            <span className="truncate">{option}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
