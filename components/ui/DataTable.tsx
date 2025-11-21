import * as React from "react"
import { Button } from "./Button"
import { Input } from "./Input"
import { Select } from "./Select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table"

export interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
}

export interface FilterOption {
  value: string
  label: string
}

export interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'multiselect' | 'date' | 'daterange'
  options?: FilterOption[]
  placeholder?: string
}

export interface ActiveFilter {
  key: string
  value: string | string[]
  type: FilterConfig['type']
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  filterable?: boolean
  filterPlaceholder?: string
  filters?: FilterConfig[]
  activeFilters?: ActiveFilter[]
  onFiltersChange?: (filters: ActiveFilter[]) => void
  onEdit?: (item: T) => void
  selectable?: boolean
  selectedItems?: T[]
  onSelectionChange?: (items: T[]) => void
  onSelectAll?: (selected: boolean) => void
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  filterable = true,
  filterPlaceholder = "Search...",
  filters = [],
  activeFilters = [],
  onFiltersChange,
  onEdit,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  onSelectAll,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")
  const [filter, setFilter] = React.useState("")
  const [localActiveFilters, setLocalActiveFilters] = React.useState<ActiveFilter[]>(activeFilters)

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const handleFilterChange = (filterKey: string, value: string, type: FilterConfig['type']) => {
    const newFilters = localActiveFilters.filter(f => f.key !== filterKey)
    if (value && value !== '') {
      newFilters.push({ key: filterKey, value, type })
    }
    setLocalActiveFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  const clearFilter = (filterKey: string) => {
    const newFilters = localActiveFilters.filter(f => f.key !== filterKey)
    setLocalActiveFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  const clearAllFilters = () => {
    setLocalActiveFilters([])
    setFilter("")
    onFiltersChange?.([])
  }

  const filteredData = React.useMemo(() => {
    let result = data

    // Apply text search
    if (filter) {
      result = result.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(filter.toLowerCase())
        )
      )
    }

    // Apply advanced filters
    localActiveFilters.forEach(activeFilter => {
      result = result.filter((item) => {
        const itemValue = item[activeFilter.key]
        const filterValue = activeFilter.value

        switch (activeFilter.type) {
          case 'select':
            return String(itemValue) === filterValue
          case 'multiselect':
            return Array.isArray(filterValue)
              ? filterValue.includes(String(itemValue))
              : false
          case 'date':
            return new Date(itemValue as string).toDateString() === new Date(filterValue as string).toDateString()
          case 'daterange':
            if (Array.isArray(filterValue) && filterValue.length === 2) {
              const itemDate = new Date(itemValue as string)
              const startDate = new Date(filterValue[0])
              const endDate = new Date(filterValue[1])
              return itemDate >= startDate && itemDate <= endDate
            }
            return true
          default:
            return true
        }
      })
    })

    return result
  }, [data, filter, localActiveFilters])

  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [filteredData, sortKey, sortDirection])

  const handleSelectItem = (item: T, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedItems, item])
    } else {
      onSelectionChange?.(selectedItems.filter(selected => selected !== item))
    }
  }

  const handleSelectAllItems = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(sortedData)
      onSelectAll?.(true)
    } else {
      onSelectionChange?.([])
      onSelectAll?.(false)
    }
  }

  const isAllSelected = sortedData.length > 0 && selectedItems.length === sortedData.length
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < sortedData.length

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      {(filterable || filters.length > 0) && (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {filterable && (
              <Input
                placeholder={filterPlaceholder}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="max-w-sm"
              />
            )}

            {filters.map(filterConfig => {
              const activeFilter = localActiveFilters.find(f => f.key === filterConfig.key)

              switch (filterConfig.type) {
                case 'select':
                  return (
                    <div key={filterConfig.key} className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-primary">
                        {filterConfig.label}:
                      </label>
                      <Select
                        value={activeFilter?.value as string || ''}
                        onChange={(e) => handleFilterChange(filterConfig.key, e.target.value, filterConfig.type)}
                        className="w-40"
                      >
                        <option value="">{filterConfig.placeholder || 'All'}</option>
                        {filterConfig.options?.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                      {activeFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearFilter(filterConfig.key)}
                          className="h-8 w-8 p-0"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  )
                default:
                  return null
              }
            })}

            {(filter || localActiveFilters.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {localActiveFilters.length > 0 && (
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span className="text-sm text-primary">Active filters:</span>
              {localActiveFilters.map(activeFilter => {
                const config = filters.find(f => f.key === activeFilter.key)
                const label = config?.options?.find(o => o.value === activeFilter.value)?.label || activeFilter.value
                return (
                  <span
                    key={activeFilter.key}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary text-secondary"
                  >
                    {config?.label}: {label}
                    <button
                      onClick={() => clearFilter(activeFilter.key)}
                      className="ml-1 hover:bg-opacity-80 rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate
                  }}
                  onChange={(e) => handleSelectAllItems(e.target.checked)}
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead key={String(column.key)}>
                {column.sortable ? (
                  <Button
                    variant="ghost"
                    onClick={() => handleSort(column.key)}
                    className="h-auto p-0 font-medium"
                  >
                    {column.label}
                    {sortKey === column.key && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </Button>
                ) : (
                  column.label
                )}
              </TableHead>
            ))}
            {onEdit && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((item, index) => (
            <TableRow key={index}>
              {selectable && (
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item)}
                    onChange={(e) => handleSelectItem(item, e.target.checked)}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell key={String(column.key)}>
                  {String(item[column.key])}
                </TableCell>
              ))}
              {onEdit && (
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(item)}
                  >
                    Edit
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}