import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import socket from "./kanbanSocket";
import KanbanColumn from "./KanbanColumn";
import TaskModal from "./TaskModal";
import FilterBar from "./FilterBar";
import ActivityLog from "./ActivityLog";
import "../Kanban.css";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";


const KanbanBoard = () => {
  const { roomId } = useParams();

  const [tasks, setTasks] = useState({ todo: [], inprogress: [], done: [] });
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalMode, setModalMode] = useState(""); // "create" or "edit"
  const [filters, setFilters] = useState({
    mine: false,
    dueToday: false,
    highPriority: false,
    search: "",
  });
  const [activity, setActivity] = useState([]);
  const [theme, setTheme] = useState("light");

const toggleTheme = () => {
  setTheme((prev) => (prev === "light" ? "dark" : "light"));
};


  useEffect(() => {
    socket.emit("join-kanban-room", { roomId });

    socket.on("board-data", (data) => setTasks(data.tasks));
    socket.on("task-added", handleTaskAdded);
    socket.on("task-edited", handleTaskEdited);
    socket.on("task-deleted", handleTaskDeleted);
    socket.on("task-moved", handleTaskMoved);
    socket.on("activity-log", (logs) => setActivity(logs));

    return () => {
  socket.off("board-data");
  socket.off("task-added");
  socket.off("task-edited");
  socket.off("task-deleted");
  socket.off("task-moved");
  socket.off("activity-log");
};

  }, [roomId]);

  function broadcast(event, payload) {
    socket.emit(event, { roomId, ...payload });
  }

  const handleTaskAdded = ({ task, column }) => {
    setTasks((prev) => ({ ...prev, [column]: [...prev[column], task] }));
    toast.success("🆕 Task added");
  };

  const handleTaskEdited = ({ task }) => {
    setTasks((prev) => {
      const newCols = {};
      for (let col of ["todo", "inprogress", "done"]) {
        newCols[col] = prev[col].map((t) => (t.id === task.id ? task : t));
      }
      return newCols;
    });
    toast("✏️ Task updated");
  };

const handleTaskDeleted = ({ column, taskId }) => {
  setTasks((prev) => ({
    ...prev,
    [column]: prev[column].filter((t) => t.id !== taskId),
  }));
  toast.error("🗑️ Task deleted");
};


const handleTaskMoved = ({ id, from, to }) => {
  setTasks((prev) => {
    const task = prev[from].find((t) => t.id === id); // ✅ Get the task
    if (!task) return prev;

    const sourceArr = prev[from].filter((t) => t.id !== id);
    const targetArr = [...prev[to], task];
    return { ...prev, [from]: sourceArr, [to]: targetArr };
  });
  setActivity((prev) => [
    `Moved from ${from} to ${to} – ${new Date().toLocaleTimeString()}`,
    ...prev,
  ]);
};



  const openCreate = (column) => {
    setModalMode("create");
    setSelectedTask({
      id: uuidv4(),
      column,
      title: "",
      desc: "",
      assignee: "",
      due: "",
      priority: "medium",
      tags: [],
    });
  };

  const openEdit = (task, column) => {
    setModalMode("edit");
    setSelectedTask({ ...task, column });
  };

  const closeModal = () => setSelectedTask(null);

  const saveTask = (taskData) => {
    if (modalMode === "create") {
      broadcast("add-task", { column: taskData.column, task: taskData });
    } else {
      broadcast("edit-task", taskData);
    }
    closeModal();
  };

const deleteTask = (id, column) => {
  broadcast("delete-task", { roomId, taskId: id, column });
  closeModal();
};



  const moveTask = (taskId, from, to) => {
    broadcast("move-task", { id: taskId, from, to });
  };


  return (
  <div className={`kanban-board ${theme}`}>
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-end mb-3">
        <div className={`theme-toggle ${theme}`} onClick={toggleTheme}>
          <div className="circle" />
          <span className="label">{theme === "light" ? "☀️ Light" : "🌙 Dark"}</span>
        </div>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} />
      <div className="row">
        {["todo", "inprogress", "done"].map((column) => (
          <div key={column} className="col-md-4">
            <KanbanColumn
              column={column}
              tasks={tasks[column]}
              filters={filters}
              onCreate={() => openCreate(column)}
              onEdit={(task) => openEdit(task, column)}
              onDelete={(task) => deleteTask(task.id, column)}
              onMove={(taskId, from, to) => moveTask(taskId, from, to)}
            />
          </div>
        ))}
      </div>
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          mode={modalMode}
          onSave={saveTask}
          onDelete={(id) => deleteTask(id, selectedTask.column)}
          onClose={closeModal}
        />
      )}
      <ActivityLog activity={activity} theme={theme} />
    </div>
  </div>
);

};

export default KanbanBoard;
