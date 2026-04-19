
import { MetaDataAtom } from "@/atoms";
import { useAtomValue } from "jotai";

import React, { useState, useRef } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";



export default function AutocompleteBox({ type, placeholder, name, currentValue }: { type: "textarea" | "input", placeholder: string, name: string, currentValue: string | undefined }) {

    const [value, setValue] = useState(currentValue);
    const [showDropdown, setShowDropdown] = useState(false);
    const [filtered, setFiltered] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const MetaData = useAtomValue(MetaDataAtom)


    const keys = Object.keys(MetaData ?? {});

    const textareaRef = useRef(null);

    const handleChange = (e) => {
        const text = e.target.value;
        const cursorPos = e.target.selectionStart;

        setValue(text);

        const textBeforeCursor = text.slice(0, cursorPos);
        const match = textBeforeCursor.match(/\{(\w*)$/);

        if (match) {
            const search = match[1].toLowerCase();

            const results = keys.filter((k) =>
                k.toLowerCase().includes(search)
            );

            setFiltered(results);
            setShowDropdown(true);
            setActiveIndex(0);
        } else {
            setShowDropdown(false);
        }
    };

    const insertValue = (selected) => {
        const textarea = textareaRef.current;
        const cursorPos = textarea.selectionStart;

        const textBeforeCursor = value.slice(0, cursorPos);
        const textAfterCursor = value.slice(cursorPos);

        const newBefore = textBeforeCursor.replace(/\{(\w*)$/, `{${selected}}`);

        const newValue = newBefore + textAfterCursor;
        console.log("fsf", textAfterCursor)

        setValue(newValue);
        setShowDropdown(false);

        // move cursor after inserted text
        setTimeout(() => {
            const pos = newValue.length;
            textarea.setSelectionRange(pos, pos);
            textarea.focus();
        }, 0);
    };

    const handleKeyDown = (e) => {
        if (!showDropdown) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) => (prev + 1) % filtered.length);
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) =>
                prev === 0 ? filtered.length - 1 : prev - 1
            );
        }

        if (e.key === "Enter") {
            e.preventDefault();
            insertValue(filtered[activeIndex]);
        }

        if (e.key === "Escape") {
            setShowDropdown(false);
        }
    };

    return (
        <div style={{ position: "relative", width: "400px" }}>
            {type === "input" ? <Input
                className="text-sm text-gray-600 border-none focus-visible:ring-0 px-0"
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                name={name} />
                : <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    rows={6}
                    style={{ width: "100%" }}
                    placeholder={placeholder}
                    className="text-sm text-gray-600 border-none focus-visible:ring-0 px-0"
                    name={name}
                />}

            {showDropdown && filtered.length > 0 && (
                <div className="absolute rounded-xl border bg-white shadow-lg z-1">
                    <ul className="max-h-48 overflow-y-auto py-1">
                        {filtered.map((item, index) => (
                            <li
                                key={item}
                                onClick={() => insertValue(item)}
                                className={`px-3 py-2 text-sm cursor-pointer transition-colors
                  ${index === activeIndex
                                        ? "bg-gray-100"
                                        : "hover:bg-gray-50"
                                    }`}
                            >
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}