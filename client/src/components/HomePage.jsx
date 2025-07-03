import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-50 to-cyan-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 text-center">
        Real-Time Collaboration Hub
      </h1>
      <p className="text-lg text-gray-600 mb-10 text-center">
        Choose your workspace to begin collaborating
      </p>

      <div className="flex flex-wrap gap-8 justify-center">
        {/* Code Editor Collaboration Card */}
        <div
          className="w-80 bg-white rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition-all p-6 cursor-pointer text-center"
          onClick={() => navigate("/homepage")}
        >
          <h2 className="text-2xl font-semibold text-teal-700 mb-2">
            🧠 Code Collaboration
          </h2>
          <p className="text-gray-600">
            Work on code with others in real-time. Share ideas and debug together.
          </p>
        </div>

        {/* Drawing + Chat Collaboration Card */}
        <div
          className="w-80 bg-white rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition-all p-6 cursor-pointer text-center"
          onClick={() => navigate("/drawingboard")}
        >
          <h2 className="text-2xl font-semibold text-purple-700 mb-2">
            🎨 Drawing + Chat
          </h2>
          <p className="text-gray-600">
            Sketch ideas and chat live with your teammates on a shared canvas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
