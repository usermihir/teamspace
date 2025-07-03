import React, { useEffect, useRef, useState } from "react";
import "codemirror/mode/javascript/javascript";
import "codemirror/theme/dracula.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/lib/codemirror.css";
import CodeMirror from "codemirror";
import { ACTIONS } from "../Actions";

function Editor({ socketRef, roomId, onCodeChange, username }) {
  const editorRef = useRef(null);
  const [roomUsers, setRoomUsers] = useState([]);

  useEffect(() => {
    const init = async () => {
      const editor = CodeMirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: { name: "javascript", json: true },
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
        }
      );
      editorRef.current = editor;
      editor.setSize(null, "100%");
      editorRef.current.on("change", (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        if (origin !== "setValue") {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
        }
      });
    };

    init();
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null) {
          editorRef.current.setValue(code);
        }
      });

      socketRef.current.on("room-users", (users) => {
        setRoomUsers(users);
      });
    }
    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE);
      socketRef.current.off("room-users");
    };
  }, [socketRef.current]);

  return (
    <div style={{ position: "relative", height: "600px" }}>
      <textarea id="realtimeEditor"></textarea>

      {/* Online Users Display */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          backgroundColor: "#222",
          padding: "12px",
          borderRadius: "10px",
          color: "white",
          zIndex: 999,
          maxWidth: "280px",
          boxShadow: "0 0 10px rgba(0,0,0,0.5)",
        }}
      >
        <h6 className="mb-2">
          🧑‍🤝‍🧑 {roomUsers.length} {roomUsers.length === 1 ? "user" : "users"} online
        </h6>
        <ul className="list-unstyled mb-0" style={{ fontSize: "14px" }}>
          {roomUsers.map((user) => (
            <li key={user.socketId}>
              <strong>{user.username}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Editor;
