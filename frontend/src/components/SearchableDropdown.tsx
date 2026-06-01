/**
 * Searchable autocomplete dropdown. Type to filter, tap to select.
 * Supports a free-text "Other" sentinel that reveals a plain TextInput.
 *
 * FIX: useState(value) only runs once on mount. On revisit the ScanContext
 * already holds the previous selection, so query is pre-filled but focused
 * stays false — the list never opens. We sync query via useEffect and show
 * a tappable chip when a value is already selected so users can change it.
 */
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { C, F, S } from "../theme";

type Props = {
  label: string;
  placeholder: string;
  items: string[];
  value: string;
  onChange: (v: string) => void;
  allowOther?: boolean;
  testID?: string;
};

export default function SearchableDropdown({
  label,
  placeholder,
  items,
  value,
  onChange,
  allowOther = false,
  testID,
}: Props) {
  const [query, setQuery] = useState(value || "");
  const [focused, setFocused] = useState(false);
  const [otherMode, setOtherMode] = useState(
    allowOther && !!value && !items.includes(value)
  );
  const prevValueRef = useRef(value);

  // KEY FIX: sync internal query when the external value changes (e.g. on
  // revisit when ScanContext already holds a previous selection, or when
  // the parent resets value to "").
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      if (!value) {
        setQuery("");
        setFocused(false);
        setOtherMode(false);
      } else if (items.includes(value)) {
        setQuery(value);
        setOtherMode(false);
      } else if (allowOther && value) {
        setOtherMode(true);
      }
    }
  }, [value, items, allowOther]);

  // Also sync otherMode when items load asynchronously after first render
  useEffect(() => {
    if (allowOther && value && items.length > 0 && !items.includes(value)) {
      setOtherMode(true);
    }
  }, [items, value, allowOther]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = allowOther ? [...items, "Other"] : items;
    if (!q) return base;
    const starts = base.filter((s) => s.toLowerCase().startsWith(q));
    const contains = base.filter(
      (s) => !s.toLowerCase().startsWith(q) && s.toLowerCase().includes(q)
    );
    return [...starts, ...contains];
  }, [query, items, allowOther]);

  if (otherMode) {
    return (
      <View style={styles.wrap} testID={testID}>
        <Text style={[F.label, { marginBottom: S.s2 }]}>{label}</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Enter custom value"
            placeholderTextColor={C.textSubtle}
            value={value}
            onChangeText={onChange}
            testID={`${testID}-other-input`}
          />
          <TouchableOpacity
            onPress={() => {
              setOtherMode(false);
              onChange("");
              setQuery("");
              setFocused(false);
            }}
            style={styles.switchBtn}
            testID={`${testID}-switch-list`}
          >
            <Ionicons name="list" size={18} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap} testID={testID}>
      <Text style={[F.label, { marginBottom: S.s2 }]}>{label}</Text>

      {/* When a value is already selected and not focused: show a chip.
          Tapping the chip clears the selection and opens the search. */}
      {!!value && !focused ? (
        <TouchableOpacity
          style={styles.selectedChip}
          onPress={() => {
            setQuery("");
            onChange("");
            setFocused(true);
          }}
          testID={`${testID}-chip`}
        >
          <Text style={styles.chipText} numberOfLines={1}>{value}</Text>
          <Ionicons name="pencil" size={15} color={C.textMuted} />
        </TouchableOpacity>
      ) : (
        /* Search box — shown when no value yet or actively editing */
        <View style={[styles.input, styles.searchBox]}>
          <Ionicons name="search" size={18} color={C.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor={C.textSubtle}
            value={query}
            onFocus={() => setFocused(true)}
            onChangeText={(t) => {
              setQuery(t);
              setFocused(true);
              if (value) onChange("");
            }}
            testID={`${testID}-search`}
          />
          {!!query && (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                onChange("");
              }}
              testID={`${testID}-clear`}
            >
              <Ionicons name="close-circle" size={18} color={C.textSubtle} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {focused && (
        <View style={styles.dropdown}>
          <FlatList
            data={filtered}
            keyExtractor={(i) => i}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
            style={{ maxHeight: 260 }}
            ListEmptyComponent={
              <Text style={styles.empty}>No matches</Text>
            }
            renderItem={({ item }) => {
              const isOther = item === "Other";
              const selected = item === value;
              return (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    if (isOther) {
                      setOtherMode(true);
                      onChange("");
                      setFocused(false);
                      setQuery("");
                      return;
                    }
                    onChange(item);
                    setQuery(item);
                    setFocused(false);
                  }}
                  testID={`${testID}-item-${item}`}
                >
                  <Text
                    style={[
                      styles.itemText,
                      selected && { fontWeight: "700", color: C.primary },
                      isOther && { color: C.ai.text, fontWeight: "700" },
                    ]}
                  >
                    {item}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark" size={18} color={C.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    height: S.hInput,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: S.rMd,
    paddingHorizontal: S.s4,
    color: C.text,
    fontSize: 15,
    flex: 1,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: S.s4,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 15,
    height: "100%",
  },
  selectedChip: {
    height: S.hInput,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: S.rMd,
    paddingHorizontal: S.s4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  chipText: {
    flex: 1,
    color: C.text,
    fontSize: 15,
    fontWeight: "600",
  },
  switchBtn: {
    width: S.hInput,
    height: S.hInput,
    borderRadius: S.rMd,
    backgroundColor: C.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  dropdown: {
    marginTop: S.s2,
    backgroundColor: C.surface,
    borderRadius: S.rMd,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: S.s4,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSubtle,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemText: { color: C.text, fontSize: 15 },
  empty: { padding: S.s5, color: C.textMuted, textAlign: "center" },
});
