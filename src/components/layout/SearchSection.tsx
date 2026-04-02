"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SearchSection() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Products");
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const tabs = ["Raw Materials", "Products", "Manufacturers", "Worldwide"];

  const productSuggestions = [
    "electric car",
    "mobile telephone",
    "air pods",
    "laptop computer",
    "smart watch",
    "wireless headphones",
    "gaming console",
    "digital camera",
    "smart home devices",
    "fitness tracker",
    "tablet device",
    "bluetooth speaker",
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  // Typing animation effect
  useEffect(() => {
    const currentText = productSuggestions[currentPlaceholder];

    if (isTyping && !isDeleting) {
      // Typing phase
      if (displayedText.length < currentText.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentText.slice(0, displayedText.length + 1));
        }, 100);
        return () => clearTimeout(timeout);
      } else {
        // Finished typing, start pause before deleting
        const timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 1500);
        return () => clearTimeout(timeout);
      }
    } else if (isDeleting) {
      // Deleting phase
      if (displayedText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, 50);
        return () => clearTimeout(timeout);
      } else {
        // Finished deleting, move to next suggestion
        setIsDeleting(false);
        setCurrentPlaceholder((prev) => (prev + 1) % productSuggestions.length);
      }
    }
    return undefined;
  }, [
    displayedText,
    currentPlaceholder,
    isTyping,
    isDeleting,
    productSuggestions,
  ]);

  // Hide on messages page - must be AFTER all hooks
  if (pathname?.startsWith("/messages")) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 mt-4 md:mt-8">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Navigation Menu */}
        <nav className="flex justify-center gap-4 md:gap-8 mb-4 md:mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "text-orange-600 border-b-2 border-orange-600"
                  : "text-gray-600 hover:text-orange-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Search Container */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSearch}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border border-orange-600 rounded-2xl md:rounded-full px-4 md:px-6 py-3 md:py-3 bg-white shadow-sm gap-3 md:gap-0">
              {/* Left Group: Input and Image Search */}
              <div className="flex items-center gap-2 md:gap-4 flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={displayedText}
                  className="flex-1 text-gray-900 placeholder-gray-500 bg-transparent border-none outline-none text-base md:text-lg"
                />
                <button
                  type="button"
                  className="flex items-center gap-0.5 md:gap-1 text-gray-600 hover:text-orange-600 transition-colors flex-shrink-0"
                >
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-xs md:text-sm font-medium">
                    Image Search
                  </span>
                </button>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="px-6 md:px-8 py-2 md:py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-sm md:text-base"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
