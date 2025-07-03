import React from "react";
import "../ActivityLog.css";

const ActivityLog = ({ activity, theme }) => (
  <div
    className={`position-fixed bottom-0 end-0 m-3 p-2 rounded shadow activity-log ${theme}`}
    style={{ maxWidth: "300px", maxHeight: "200px", overflow: "auto" }}
  >
    <h6>Recent Activity</h6>
    <ul className="small mb-0">
      {activity.map((a, i) => (
        <li key={i}>{a}</li>
      ))}
    </ul>
  </div>
);

export default ActivityLog;
