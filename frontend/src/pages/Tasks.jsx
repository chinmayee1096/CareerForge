import { Check, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/api.js";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import Modal from "../components/Modal.jsx";
import TaskForm from "../forms/TaskForm.jsx";

export default function Tasks() {
  const [tasks, setTasks] = useState(null);
  const [open, setOpen] = useState(false);
  const load = () => api.get("/tasks").then(({ data }) => setTasks(data.data));
  useEffect(() => { load(); }, []);
  if (!tasks) return <Loader label="Loading tasks" />;

  const create = async (payload) => {
    await api.post("/tasks", payload);
    setOpen(false);
    load();
  };
  const complete = async (task) => {
    await api.put(`/tasks/${task._id}`, { status: "completed" });
    load();
  };
  const remove = async (task) => {
    await api.delete(`/tasks/${task._id}`);
    load();
  };

  const getTaskStatus = (task) => {
    const isCompleted = task.status === "completed";
    const hasDeadline = !!task.deadline;

    if (isCompleted) {
      if (hasDeadline) {
        const completedTime = task.completedAt ? new Date(task.completedAt) : new Date(task.updatedAt);
        const deadlineTime = new Date(task.deadline);
        const compDate = new Date(completedTime.getFullYear(), completedTime.getMonth(), completedTime.getDate());
        const deadDate = new Date(deadlineTime.getFullYear(), deadlineTime.getMonth(), deadlineTime.getDate());
        if (compDate > deadDate) {
          return {
            label: "Completed Late",
            color: "red",
            icon: <X size={14} />
          };
        }
      }
      return {
        label: "Completed",
        color: "green",
        icon: <Check size={14} />
      };
    } else {
      if (hasDeadline) {
        const now = new Date();
        const deadlineTime = new Date(task.deadline);
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const deadDate = new Date(deadlineTime.getFullYear(), deadlineTime.getMonth(), deadlineTime.getDate());
        if (nowDate > deadDate) {
          return {
            label: "Overdue",
            color: "red",
            icon: <X size={14} />
          };
        }
      }
      return {
        label: task.status,
        color: "blue",
        icon: null
      };
    }
  };

  return (
    <>
      <div className="page-title row"><div><h1>Task Planner</h1><p>Plan, prioritize, and close placement preparation work.</p></div><button className="primary-button" onClick={() => setOpen(true)}><Plus size={17} /> New task</button></div>
      <section className="panel">
        {tasks.length === 0 ? <EmptyState title="No tasks yet" /> : (
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Deadline</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const statusInfo = getTaskStatus(task);
                const statusPillClass = statusInfo.color === "green" 
                  ? "status-offer" 
                  : statusInfo.color === "red" 
                  ? "status-rejected" 
                  : task.status === "in-progress" 
                  ? "status-interviewing" 
                  : "status-applied";

                return (
                  <tr key={task._id}>
                    <td>{task.title}</td>
                    <td>{task.category}</td>
                    <td><span className={`pill ${task.priority}`}>{task.priority}</span></td>
                    <td>{task.deadline ? new Date(task.deadline).toLocaleDateString("en-IN") : "No deadline"}</td>
                    <td>
                      <span className={`status-pill ${statusPillClass}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        {statusInfo.icon}
                        <span style={{ textTransform: "capitalize" }}>{statusInfo.label}</span>
                      </span>
                    </td>
                    <td className="actions">
                      {task.status === "completed" ? (
                        <div 
                          className="icon-button" 
                          style={{ 
                            cursor: "default", 
                            borderColor: statusInfo.color === "green" ? "#22c55e" : "#ef4444",
                            backgroundColor: statusInfo.color === "green" ? "#f0fdf4" : "#fef2f2",
                            color: statusInfo.color === "green" ? "#166534" : "#991b1b"
                          }}
                          title={statusInfo.label}
                        >
                          {statusInfo.color === "green" ? <Check size={17} /> : <X size={17} />}
                        </div>
                      ) : (
                        <button 
                          className="icon-button" 
                          onClick={() => complete(task)}
                          title="Mark as completed"
                        >
                          <Check size={17} />
                        </button>
                      )}
                      <button className="icon-button" onClick={() => remove(task)} title="Delete task"><Trash2 size={17} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
      <Modal open={open} title="Create task" onClose={() => setOpen(false)}><TaskForm onSubmit={create} /></Modal>
    </>
  );
}
