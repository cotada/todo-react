import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Heroicons (Outline)
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m6.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const API_URL = 'http://localhost:8000/api/v1';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState('0');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingPriority, setEditingPriority] = useState(0);
  const [prioritySort, setPrioritySort] = useState('desc');

  // Sort function that considers priority direction
  const sortTasks = useCallback((tasksToSort) => {
    return [...tasksToSort].sort((a, b) => {
      // Sort by completion status first
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      // For incomplete tasks
      if (!a.completed && !b.completed) {
        const priorityA = a.priority || 0;
        const priorityB = b.priority || 0;
        
        // If one task has priority and the other doesn't
        if ((priorityA === 0) !== (priorityB === 0)) {
          return priorityA === 0 ? 1 : -1;
        }
        
        // If both tasks have priority or both don't
        if (priorityA === priorityB) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        
        // Sort by priority value
        return prioritySort === 'desc' ? priorityB - priorityA : priorityA - priorityB;
      }
      
      // Sort completed tasks by creation date
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [prioritySort]);

  // Add a function to group tasks for display
  const groupTasks = useCallback((tasks) => {
    const incompleteTasks = tasks.filter(task => !task.completed);
    const completedTasks = tasks.filter(task => task.completed);

    const priorityTasks = incompleteTasks.filter(task => task.priority > 0);
    const noPriorityTasks = incompleteTasks.filter(task => !task.priority || task.priority === 0);

    return {
      priorityTasks,
      noPriorityTasks,
      completedTasks
    };
  }, []);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/tasks`);
      setTasks(sortTasks(response.data));
    } catch (error) {
      const errorMessage = error.response
        ? `Error: ${error.response.status} - ${error.response.statusText}`
        : error.message || 'Failed to fetch tasks. Please try again later.';
      setError(errorMessage);
      console.error('Error details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleTask = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/tasks/${id}`);
      setSelectedTask(response.data);
    } catch (error) {
      const errorMessage = error.response
        ? `Error: ${error.response.status} - ${error.response.statusText}`
        : error.message || 'Failed to fetch task details. Please try again later.';
      setError(errorMessage);
      console.error('Error details:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const taskData = {
        title: newTask,
        completed: false,
        priority: parseInt(newPriority, 10) || 0
      };

      const response = await axios.post(`${API_URL}/tasks`, {
        task: taskData
      });

      setTasks(prevTasks => sortTasks([...prevTasks, response.data]));
      setNewTask('');
      setNewPriority('0');
    } catch (error) {
      setError('Failed to add task. Please try again.');
      console.error('Error adding task:', error);
    }
  };

  const startEditing = (task) => {
    setSelectedTask(task);
    setEditingTitle(task.title);
    setEditingPriority(task.priority || 0);
    setIsEditing(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateTask(selectedTask.id, {
      title: editingTitle,
      priority: editingPriority,
      completed: selectedTask.completed
    });
  };

  const updateTask = async (taskId, updates) => {
    if (!updates.title?.trim()) return;

    try {
      const response = await axios.put(`${API_URL}/tasks/${taskId}`, {
        task: {
          title: updates.title,
          priority: updates.priority,
          completed: updates.completed
        }
      });

      setTasks(prevTasks =>
        sortTasks(prevTasks.map(task =>
          task.id === taskId ? response.data : task
        ))
      );

      if (isEditing) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  };

  const updateTaskPriority = async (taskId, newPriority) => {
    try {
      const priorityValue = parseInt(newPriority, 10);
      const response = await axios.patch(`${API_URL}/tasks/${taskId}`, {
        task: { priority: priorityValue || 0 }
      });

      setTasks(prevTasks => sortTasks(
        prevTasks.map(task => task.id === taskId ? response.data : task)
      ));

      if (selectedTask?.id === taskId) {
        setSelectedTask(response.data);
      }
    } catch (error) {
      setError('Failed to update task priority. Please try again.');
      console.error('Error updating task priority:', error);
    }
  };

  const toggleTask = async (taskId, currentCompleted) => {
    try {
      const response = await axios.patch(`${API_URL}/tasks/${taskId}`, {
        task: { completed: !currentCompleted }
      });

      setTasks(prevTasks => sortTasks(
        prevTasks.map(task => task.id === taskId ? response.data : task)
      ));

      if (selectedTask?.id === taskId) {
        setSelectedTask(response.data);
      }
    } catch (error) {
      setError('Failed to update task status. Please try again.');
      console.error('Error updating task status:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`);
      
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
        setIsEditing(false);
      }
    } catch (error) {
      setError('Failed to delete task. Please try again.');
      console.error('Error deleting task:', error);
    }
  };

  // Effect to resort tasks when priority sort changes
  useEffect(() => {
    setTasks(prevTasks => sortTasks([...prevTasks]));
  }, [prioritySort, sortTasks]);

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:mx-auto w-full max-w-4xl px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Task List</h1>

                <form onSubmit={addTask} className="mt-8 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Title
                    </label>
                    <input
                      type="text"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      placeholder="Enter a new task"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Level
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="0">No Priority</option>
                      <option value="1">Low (1)</option>
                      <option value="2">Low (2)</option>
                      <option value="3">Low (3)</option>
                      <option value="4">Medium (4)</option>
                      <option value="5">Medium (5)</option>
                      <option value="6">Medium (6)</option>
                      <option value="7">High (7)</option>
                      <option value="8">High (8)</option>
                      <option value="9">High (9)</option>
                      <option value="10">Urgent (10)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none"
                  >
                    Add Task
                  </button>
                </form>

                {loading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : (
                  <div className="space-y-6">
                    <div className="mt-8">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Tasks</h2>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600">Priority Sort:</label>
                          <select
                            value={prioritySort}
                            onChange={(e) => setPrioritySort(e.target.value)}
                            className="px-2 py-1 border rounded bg-white text-sm"
                          >
                            <option value="desc">High to Low</option>
                            <option value="asc">Low to High</option>
                          </select>
                        </div>
                      </div>
                      {error && <div className="text-red-500 mb-4">{error}</div>}
                    </div>

                    {/* Active Tasks with Priority */}
                    {groupTasks(tasks).priorityTasks.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Priority Tasks</h3>
                        <ul className="space-y-3">
                          {groupTasks(tasks).priorityTasks.map((task) => (
                            <li
                              key={task.id}
                              className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
                            >
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() => toggleTask(task.id, task.completed)}
                                  className="h-5 w-5 rounded border-gray-300"
                                />
                                <span className={task.completed ? 'line-through text-gray-500' : ''}>
                                  {task.title}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <label className="text-sm text-gray-600 whitespace-nowrap">Priority Level:</label>
                                  <select
                                    value={task.priority ?? '0'}
                                    onChange={(e) => updateTaskPriority(task.id, e.target.value)}
                                    className="w-40 px-2 py-1 border rounded bg-white"
                                  >
                                    <option value="0">No Priority</option>
                                    <option value="1">Low (1)</option>
                                    <option value="2">Low (2)</option>
                                    <option value="3">Low (3)</option>
                                    <option value="4">Medium (4)</option>
                                    <option value="5">Medium (5)</option>
                                    <option value="6">Medium (6)</option>
                                    <option value="7">High (7)</option>
                                    <option value="8">High (8)</option>
                                    <option value="9">High (9)</option>
                                    <option value="10">Urgent (10)</option>
                                  </select>
                                </div>
                                <button
                                  onClick={() => startEditing(task)}
                                  className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50"
                                  title="Edit task"
                                >
                                  <PencilIcon />
                                </button>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                                  title="Delete task"
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Active Tasks without Priority */}
                    {groupTasks(tasks).noPriorityTasks.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Tasks without Priority</h3>
                        <ul className="space-y-3">
                          {groupTasks(tasks).noPriorityTasks.map((task) => (
                            <li
                              key={task.id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow"
                            >
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() => toggleTask(task.id, task.completed)}
                                  className="h-5 w-5 rounded border-gray-300"
                                />
                                <span className={task.completed ? 'line-through text-gray-500' : ''}>
                                  {task.title}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <label className="text-sm text-gray-600 whitespace-nowrap">Priority Level:</label>
                                  <select
                                    value={task.priority ?? '0'}
                                    onChange={(e) => updateTaskPriority(task.id, e.target.value)}
                                    className="w-40 px-2 py-1 border rounded bg-gray-50"
                                  >
                                    <option value="0">No Priority</option>
                                    <option value="1">Low (1)</option>
                                    <option value="2">Low (2)</option>
                                    <option value="3">Low (3)</option>
                                    <option value="4">Medium (4)</option>
                                    <option value="5">Medium (5)</option>
                                    <option value="6">Medium (6)</option>
                                    <option value="7">High (7)</option>
                                    <option value="8">High (8)</option>
                                    <option value="9">High (9)</option>
                                    <option value="10">Urgent (10)</option>
                                  </select>
                                </div>
                                <button
                                  onClick={() => startEditing(task)}
                                  className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50"
                                  title="Edit task"
                                >
                                  <PencilIcon />
                                </button>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                                  title="Delete task"
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Completed Tasks */}
                    {groupTasks(tasks).completedTasks.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Completed Tasks</h3>
                        <ul className="space-y-3">
                          {groupTasks(tasks).completedTasks.map((task) => (
                            <li
                              key={task.id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow"
                            >
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() => toggleTask(task.id, task.completed)}
                                  className="h-5 w-5 rounded border-gray-300"
                                />
                                <span className="line-through text-gray-500">
                                  {task.title}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <label className="text-sm text-gray-600 whitespace-nowrap">Priority Level:</label>
                                  <select
                                    value={task.priority ?? '0'}
                                    onChange={(e) => updateTaskPriority(task.id, e.target.value)}
                                    className="w-40 px-2 py-1 border rounded bg-gray-50"
                                    disabled
                                  >
                                    <option value="0">No Priority</option>
                                    <option value="1">Low (1)</option>
                                    <option value="2">Low (2)</option>
                                    <option value="3">Low (3)</option>
                                    <option value="4">Medium (4)</option>
                                    <option value="5">Medium (5)</option>
                                    <option value="6">Medium (6)</option>
                                    <option value="7">High (7)</option>
                                    <option value="8">High (8)</option>
                                    <option value="9">High (9)</option>
                                    <option value="10">Urgent (10)</option>
                                  </select>
                                </div>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                                  title="Delete task"
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isEditing && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-semibold mb-4">Edit Task</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <select
                  value={editingPriority}
                  onChange={(e) => setEditingPriority(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="0">No Priority</option>
                  <option value="1">Low (1)</option>
                  <option value="2">Low (2)</option>
                  <option value="3">Low (3)</option>
                  <option value="4">Medium (4)</option>
                  <option value="5">Medium (5)</option>
                  <option value="6">Medium (6)</option>
                  <option value="7">High (7)</option>
                  <option value="8">High (8)</option>
                  <option value="9">High (9)</option>
                  <option value="10">Urgent (10)</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedTask.completed}
                  onChange={() => setSelectedTask({
                    ...selectedTask,
                    completed: !selectedTask.completed
                  })}
                  className="h-5 w-5 rounded border-gray-300"
                  id="completed-checkbox"
                />
                <label 
                  htmlFor="completed-checkbox"
                  className="text-sm font-medium text-gray-700"
                >
                  Mark as completed
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;