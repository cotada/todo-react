import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/tasks`);
      setTasks(response.data);
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
      const response = await axios.post(`${API_URL}/tasks`, {
        task: { title: newTask, completed: false }
      });
      setTasks([...tasks, response.data]);
      setNewTask('');
    } catch (error) {
      const errorMessage = error.response 
        ? `Error: ${error.response.status} - ${error.response.statusText}`
        : error.message || 'Failed to add task. Please try again later.';
      setError(errorMessage);
      console.error('Error details:', error);
    }
  };

  const toggleTask = async (id, completed) => {
    try {
      await axios.patch(`${API_URL}/tasks/${id}`, {
        task: { completed: !completed }
      });
      setTasks(tasks.map(task =>
        task.id === id ? { ...task, completed: !completed } : task
      ));
    } catch (error) {
      const errorMessage = error.response 
        ? `Error: ${error.response.status} - ${error.response.statusText}`
        : error.message || 'Failed to update task. Please try again later.';
      setError(errorMessage);
      console.error('Error details:', error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/tasks/${id}`);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      const errorMessage = error.response 
        ? `Error: ${error.response.status} - ${error.response.statusText}`
        : error.message || 'Failed to delete task. Please try again later.';
      setError(errorMessage);
      console.error('Error details:', error);
    }
  };

  const updateTask = async (id, updates) => {
    try {
      setError(null);
      const response = await axios.patch(`${API_URL}/tasks/${id}`, {
        task: updates
      });
      
      // Update both the tasks list and selected task
      setTasks(tasks.map(task =>
        task.id === id ? response.data : task
      ));
      setSelectedTask(response.data);
      setIsEditing(false);
    } catch (error) {
      const errorMessage = error.response 
        ? `Error: ${error.response.status} - ${error.response.statusText}`
        : error.message || 'Failed to update task. Please try again later.';
      setError(errorMessage);
      console.error('Error details:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Task List</h1>
                
                <form onSubmit={addTask} className="mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="Add a new task..."
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none"
                    >
                      Add
                    </button>
                  </div>
                </form>

                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading tasks...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-4">
                    <p className="text-red-500">{error}</p>
                    <button 
                      onClick={fetchTasks}
                      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none"
                    >
                      Retry
                    </button>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No tasks yet. Add your first task above!</p>
                  </div>
                ) : (
                  <div>
                    {selectedTask && (
                      <div className="mb-6 p-4 bg-white rounded-lg shadow">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">Task Details</h3>
                          <button
                            onClick={() => setSelectedTask(null)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              {isEditing ? (
                                <form 
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    updateTask(selectedTask.id, { title: editingTitle });
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                    autoFocus
                                  />
                                  <button
                                    type="submit"
                                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                  >
                                    Cancel
                                  </button>
                                </form>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <p>
                                    <span className="font-medium">Title:</span>{' '}
                                    {selectedTask.title}
                                  </p>
                                  <button
                                    onClick={() => {
                                      setEditingTitle(selectedTask.title);
                                      setIsEditing(true);
                                    }}
                                    className="ml-2 text-blue-500 hover:text-blue-700"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p>
                              <span className="font-medium">Status:</span>{' '}
                              <span className={selectedTask.completed ? 'text-green-600' : 'text-yellow-600'}>
                                {selectedTask.completed ? 'Completed' : 'Pending'}
                              </span>
                            </p>
                            <button
                              onClick={() => updateTask(selectedTask.id, { completed: !selectedTask.completed })}
                              className={`px-3 py-1 rounded-full text-sm ${
                                selectedTask.completed
                                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {selectedTask.completed ? 'Mark as Pending' : 'Mark as Completed'}
                            </button>
                          </div>
                          <p><span className="font-medium">Created:</span> {new Date(selectedTask.created_at).toLocaleString()}</p>
                          <p><span className="font-medium">Last Updated:</span> {new Date(selectedTask.updated_at).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    <ul className="space-y-3">
                      {tasks.map(task => (
                        <li
                          key={task.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                          onClick={() => fetchSingleTask(task.id)}
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleTask(task.id, task.completed);
                            }}
                            className="h-5 w-5 text-blue-500"
                          />
                          <span className={`flex-1 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                            {task.title}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTask(task.id);
                            }}
                            className="px-2 py-1 text-red-500 hover:text-red-700 focus:outline-none"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;