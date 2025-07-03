import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const TaskModal = ({ task, mode, onSave, onDelete, onClose }) => {
  const [form, setForm] = useState({ ...task });
  const isCreate = mode === "create";

  useEffect(() => {
    setForm({ ...task }); // Reset form when modal opens with different task
  }, [task]);

  return (
    <Modal show onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{isCreate ? "New Task" : "Edit Task"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {["title", "assignee", "desc"].map((field) => (
          <div className="mb-3" key={field}>
            <label className="form-label text-capitalize">{field}</label>
            <input
              type="text"
              className="form-control"
              value={form[field] || ""}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          </div>
        ))}
        <div className="mb-3">
          <label className="form-label">Due Date</label>
          <DatePicker
            selected={form.due ? new Date(form.due) : null}
            onChange={(d) =>
              setForm({
                ...form,
                due: d?.toISOString().split("T")[0] || "",
              })
            }
            className="form-control"
            dateFormat="yyyy-MM-dd"
            placeholderText="Select due date"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Priority</label>
          <select
            className="form-select"
            value={form.priority || "medium"}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            {["low", "medium", "high"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Tags (comma-separated)</label>
          <input
            type="text"
            className="form-control"
            value={(form.tags || []).join(",")}
            onChange={(e) =>
              setForm({
                ...form,
                tags: e.target.value.split(",").map((tag) => tag.trim()),
              })
            }
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        {!isCreate && (
          <button
            className="btn btn-danger me-auto"
            onClick={() => onDelete(form.id)}
          >
            🗑️ Delete
          </button>
        )}
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={() => onSave(form)}>
          {isCreate ? "Add" : "Save"}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default TaskModal;
