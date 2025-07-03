import React from "react";
import TaskCard from "./TaskCard";

const titles = {
  todo: "📝 To Do",
  inprogress: "⚙️ In Progress",
  done: "✅ Done",
};

const KanbanColumn = ({ column, tasks, onCreate, onEdit, onDelete, onMove, filters }) => {
  const applyFilters = (t) => {
    if (filters.mine && filters.username && t.assignee !== filters.username) return false;
    if (filters.highPriority && t.priority !== "high") return false;
    if (filters.dueToday) {
      const due = new Date(t.due);
      const today = new Date();
      if (due.toDateString() !== today.toDateString()) return false;
    }
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  };

  const filteredTasks = tasks.filter(applyFilters);

  return (
    <div className="bg-dark text-white rounded p-3 min-vh-50">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5>{titles[column]}</h5>
        <button className="btn btn-sm btn-light" onClick={onCreate}>➕</button>
      </div>
      {filteredTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          column={column}
          onEdit={() => onEdit(task)}
          onDelete={() => onDelete(task)}
          onMove={(to) => onMove(task.id, column, to)}
        />
      ))}
      {filteredTasks.length === 0 && <p className="text-muted">No tasks</p>}
    </div>
  );
};

export default KanbanColumn;
