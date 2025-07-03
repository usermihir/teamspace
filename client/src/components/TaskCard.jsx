import React from "react";

const priorityColor = {
  low: "success",
  medium: "warning",
  high: "danger",
};

const columnLabels = {
  todo: "To Do",
  inprogress: "In Progress",
  done: "Done",
};

const TaskCard = ({ task, onEdit, onDelete, onMove, column }) => {
  const others = ["todo", "inprogress", "done"].filter((c) => c !== column);

  return (
    <div className="card mb-2">
      <div className="card-body p-2">
        <h6>{task.title}</h6>
        <p className="small mb-1">👤 {task.assignee}</p>
        <p className="small mb-1">📅 {task.desc}</p>
        {task.tags?.map((tag) => (
          <span key={tag} className="badge bg-info me-1">{tag}</span>
        ))}
        <span className={`badge bg-${priorityColor[task.priority] || "secondary"} float-end`}>
          {task.priority}
        </span>
        <div className="mt-2">
          {others.map((dest) => (
            <button
              key={dest}
              className="btn btn-sm btn-outline-secondary me-1"
              onClick={() => onMove(dest)}
            >
              → {columnLabels[dest]}
            </button>
          ))}
          <button className="btn btn-sm btn-outline-primary me-1" onClick={onEdit}>
            ✏️
          </button>
          <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
