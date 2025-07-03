import React from "react";

const FilterBar = ({ filters, setFilters }) => (
  <div className="d-flex gap-2 mb-3 align-items-center">
    <input
      type="text"
      className="form-control w-50"
      placeholder="🔍 Search tasks..."
      value={filters.search}
      onChange={e=>setFilters({...filters,search:e.target.value})}
    />
    {["mine","dueToday","highPriority"].map(f => (
      <div className="form-check" key={f}>
        <input
          className="form-check-input"
          type="checkbox"
          id={f}
          checked={filters[f]}
          onChange={() => setFilters(s=>({...s,[f]:!s[f]}))}
        />
        <label className="form-check-label" htmlFor={f}>
          {f==="mine"?"My Tasks":f==="dueToday"?"Due Today":"High Priority"}
        </label>
      </div>
    ))}
  </div>
);

export default FilterBar;
