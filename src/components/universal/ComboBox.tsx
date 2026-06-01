"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { HiChevronDown, HiXMark } from "react-icons/hi2";

interface ComboOption {
  id: string;
  nama: string;
}

interface ComboBoxProps {
  options: ComboOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
  customOption?: ComboOption;
  disabled?: boolean;
}

export default function ComboBox({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  className = "",
  customOption,
  disabled = false,
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Combine regular options with any custom option at the end
  const allOptions = useMemo(() => {
    if (customOption) {
      return [...options, customOption];
    }
    return options;
  }, [options, customOption]);

  // Find currently selected option to display in input when not active/editing
  const selectedOption = useMemo(() => {
    return allOptions.find((opt) => opt.id === value);
  }, [allOptions, value]);

  // Filter options based on typed query
  const filteredOptions = useMemo(() => {
    if (!query) return allOptions;
    const lowerQuery = query.toLowerCase();
    return allOptions.filter((opt) =>
      opt.nama.toLowerCase().includes(lowerQuery)
    );
  }, [allOptions, query]);

  // Sync query when value changes or dropdown opens/closes
  useEffect(() => {
    if (!isOpen) {
      setQuery(selectedOption ? selectedOption.nama : "");
    } else {
      // Clear input so user sees all options and can start typing immediately
      setQuery("");
    }
  }, [isOpen, selectedOption]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prevIndex) =>
          prevIndex < filteredOptions.length - 1 ? prevIndex + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : filteredOptions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredOptions.length
        ) {
          const selected = filteredOptions[highlightedIndex];
          onChange(selected.id);
          setIsOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
      case "Tab":
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Reset highlight index when filter list changes
  useEffect(() => {
    setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1);
  }, [filteredOptions]);

  const handleSelectOption = (opt: ComboOption) => {
    onChange(opt.id);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    inputRef.current?.focus();
  };

  const widthClass = className.split(" ").some(c => c.startsWith("w-")) ? "" : "w-full";

  return (
    <div ref={containerRef} className={`relative ${widthClass} ${className}`}>
      <div
        className={`relative w-full ${disabled ? "cursor-not-allowed opacity-60" : "cursor-text"}`}
        onClick={() => {
          if (disabled) return;
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          className={`w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder-gray-400 transition-all ${
            disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white"
          }`}
          placeholder={selectedOption ? selectedOption.nama : placeholder}
          value={query}
          onChange={(e) => {
            if (disabled) return;
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-0.5">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Clear selection"
            >
              <HiXMark className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            className={`p-1 rounded-md text-gray-400 hover:text-gray-600 transition-colors ${
              disabled ? "cursor-not-allowed" : ""
            }`}
            onClick={(e) => {
              if (disabled) return;
              e.stopPropagation();
              setIsOpen((prev) => !prev);
              if (!isOpen) inputRef.current?.focus();
            }}
          >
            <HiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[99] w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-60 flex flex-col">
          <div className="overflow-y-auto flex-1 py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2.5 text-sm text-gray-500 text-center">
                Tidak ada hasil ditemukan
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.id === value;
                const isHighlighted = index === highlightedIndex;
                const isCustomOption = customOption && opt.id === customOption.id;

                return (
                  <div
                    key={opt.id}
                    className={`px-3 py-2 text-sm cursor-pointer select-none transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-primary-50 text-primary-700 font-semibold"
                        : isHighlighted
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    } ${isCustomOption ? "border-t border-gray-100 font-medium text-primary-600" : ""}`}
                    onClick={() => handleSelectOption(opt)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <span>{opt.nama}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
