import React, { useState, useEffect } from "react";

function App() {
  const [title, setTitle] = useState(
    () => localStorage.getItem("checklistTitle") || ""
  );
  const [taskName, setTaskName] = useState("");
  const [globalTasks, setGlobalTasks] = useState(() => {
    const saved = localStorage.getItem("globalTasks");
    return saved ? JSON.parse(saved) : [];
  });

  const [tasksByDate, setTasksByDate] = useState(() => {
    const saved = localStorage.getItem("tasksByDate");
    return saved ? JSON.parse(saved) : {};
  });

  const [today, setToday] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [viewDate, setViewDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split("T")[0];
  });

  const [endDate, setEndDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  const [selectedForDeletion, setSelectedForDeletion] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newDate = new Date().toISOString().split("T")[0];
      if (newDate !== today) {
        setToday(newDate);
        setViewDate(newDate);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [today]);

  useEffect(() => {
    localStorage.setItem("checklistTitle", title);
  }, [title]);

  useEffect(() => {
    localStorage.setItem("globalTasks", JSON.stringify(globalTasks));
  }, [globalTasks]);

  useEffect(() => {
    localStorage.setItem("tasksByDate", JSON.stringify(tasksByDate));
  }, [tasksByDate]);

  const ensureTasksForDate = (date) => {
    if (!tasksByDate[date]) {
      const initialized = globalTasks.map((task) => ({
        name: task.name,
        done: false,
      }));
      setTasksByDate((prev) => ({ ...prev, [date]: initialized }));
      return initialized;
    }
    return tasksByDate[date];
  };

  const getDatesInRange = (start, end) => {
    const dates = [];
    let current = new Date(start);
    const last = new Date(end);
    while (current <= last) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const addTask = () => {
    if (taskName.trim() === "") return;
    if (globalTasks.find((task) => task.name === taskName)) return;

    const newTask = { name: taskName };
    const updatedGlobalTasks = [...globalTasks, newTask];
    setGlobalTasks(updatedGlobalTasks);

    const updatedTasksByDate = { ...tasksByDate };
    const range = getDatesInRange(startDate, endDate);
    range.forEach((date) => {
      if (!updatedTasksByDate[date]) {
        updatedTasksByDate[date] = globalTasks.map((task) => ({
          name: task.name,
          done: false,
        }));
      }
      updatedTasksByDate[date] = [
        ...updatedTasksByDate[date],
        { name: taskName, done: false },
      ];
    });
    setTasksByDate(updatedTasksByDate);
    setTaskName("");
  };

  const toggleTaskDone = (taskNameToToggle) => {
    const updatedTasks = (tasksByDate[viewDate] || []).map((task) =>
      task.name === taskNameToToggle ? { ...task, done: !task.done } : task
    );
    setTasksByDate({ ...tasksByDate, [viewDate]: updatedTasks });
  };

  const toggleSelectForDeletion = (taskName) => {
    setSelectedForDeletion((prev) =>
      prev.includes(taskName)
        ? prev.filter((name) => name !== taskName)
        : [...prev, taskName]
    );
  };

  const deleteTask = () => {
    const updatedGlobalTasks = globalTasks.filter(
      (task) => !selectedForDeletion.includes(task.name)
    );
    setGlobalTasks(updatedGlobalTasks);

    const updatedTasksByDate = {};
    Object.entries(tasksByDate).forEach(([date, tasks]) => {
      updatedTasksByDate[date] = tasks.filter(
        (task) => !selectedForDeletion.includes(task.name)
      );
    });
    setTasksByDate(updatedTasksByDate);
    setSelectedForDeletion([]);
  };

  const resetAll = () => {
    setTitle("");
    setTaskName("");
    setGlobalTasks([]);
    setTasksByDate({});
    setSelectedForDeletion([]);
    localStorage.clear();
  };

  const calculateStatsByRange = (start, end) => {
    const stats = {};
    const range = getDatesInRange(start, end);
    range.forEach((date) => {
      const tasks = tasksByDate[date] || [];
      tasks.forEach((task) => {
        if (!stats[task.name]) {
          stats[task.name] = { total: 0, completed: 0 };
        }
        stats[task.name].total += 1;
        if (task.done) stats[task.name].completed += 1;
      });
    });
    return stats;
  };

  const stats = calculateStatsByRange(startDate, endDate);

  const currentTasks = ensureTasksForDate(viewDate);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="체크리스트 제목을 입력하세요"
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 20,
          width: "100%",
          padding: 8,
        }}
      />

      <h2>📝 할 일 목록</h2>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="할 일을 입력하세요"
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={addTask}>추가</button>
        <button onClick={deleteTask}>삭제</button>
        <button onClick={resetAll} style={{ backgroundColor: "#f88" }}>
          전체 초기화
        </button>
      </div>

      <ul style={{ listStyle: "none", padding: 0, marginBottom: 30 }}>
        {currentTasks.map((task, index) => (
          <li
            key={index}
            style={{ display: "flex", alignItems: "center", marginBottom: 10 }}
          >
            <input
              type="checkbox"
              checked={selectedForDeletion.includes(task.name)}
              onChange={() => toggleSelectForDeletion(task.name)}
              style={{ marginRight: 10 }}
            />
            <span style={{ flex: 1 }}>{task.name}</span>
            <button
              onClick={() => toggleTaskDone(task.name)}
              style={{ marginLeft: 10 }}
            >
              {task.done ? "✅ 완료됨" : "✔ 완료"}
            </button>
          </li>
        ))}
      </ul>

      <h2>📅 날짜 선택</h2>
      <input
        type="date"
        value={viewDate}
        onChange={(e) => setViewDate(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      <hr style={{ margin: "40px 0" }} />

      <h2>📊 기간별 통계</h2>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <label>
          시작일:{" "}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          종료일:{" "}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
              할 일
            </th>
            <th style={{ borderBottom: "1px solid #ccc" }}>완료</th>
            <th style={{ borderBottom: "1px solid #ccc" }}>전체</th>
            <th style={{ borderBottom: "1px solid #ccc" }}>달성률</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(stats).map(([name, stat]) => (
            <tr key={name}>
              <td>{name}</td>
              <td style={{ textAlign: "center" }}>{stat.completed}</td>
              <td style={{ textAlign: "center" }}>{stat.total}</td>
              <td style={{ textAlign: "center" }}>
                {((stat.completed / stat.total) * 100).toFixed(0)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
