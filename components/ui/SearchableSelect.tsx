"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";

export type SearchableSelectOption = {
  label: string;
  value: string | number;
};

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih opsi...",
  label,
  disabled = false,
  error,
}: {
  options: SearchableSelectOption[];
  value: string | number | undefined | null;
  onChange: (value: string | number | undefined) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  error?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(term));
  }, [options, searchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setSearchTerm("");
  };

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block italic-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            min-h-[42px] w-full border rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer transition-all
            ${disabled ? "bg-slate-50 cursor-not-allowed opacity-60" : "bg-white hover:border-slate-400"}
            ${isOpen ? "border-[#1e3a5f] ring-2 ring-blue-50" : "border-slate-300"}
            ${error ? "border-red-500 ring-red-50" : ""}
          `}
        >
          <div className="flex-1 overflow-hidden truncate">
            {selectedOption ? (
              <span className="text-sm font-semibold text-slate-800">{selectedOption.label}</span>
            ) : (
              <span className="text-sm text-slate-400">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {value && !disabled && (
              <X
                size={14}
                className="text-slate-400 hover:text-red-500 transition-colors"
                onClick={handleClear}
              />
            )}
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[300px]">
            <div className="p-2 border-b border-slate-100 bg-slate-50 rounded-t-lg">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  autoFocus
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-sm outline-none focus:border-[#1e3a5f] transition-all"
                  placeholder="Cari..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(opt.value);
                    }}
                    className={`
                      px-3 py-2 text-sm rounded-md cursor-pointer transition-colors
                      ${
                        String(opt.value) === String(value)
                          ? "bg-blue-50 text-[#1e3a5f] font-bold"
                          : "text-slate-700 hover:bg-slate-100"
                      }
                    `}
                  >
                    {opt.label}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                  Tidak ada hasil
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <span className="text-[10px] text-red-500 mt-1 block font-bold">{error}</span>}
    </div>
  );
}
