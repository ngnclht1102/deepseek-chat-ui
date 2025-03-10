// @ts-nocheck
import Avatar from 'components/Avatar'
import logo from 'assets/logo.svg'
import remarkGfm from "remark-gfm";
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { FiSend, FiTrash2, FiMenu, FiX, FiSettings, FiSquare } from "react-icons/fi";
import { BiBot } from "react-icons/bi";
import { FaUser } from "react-icons/fa";

const Sidebar = ({ isOpen, onClose, chats, currentChatId, onChatSelect, onRemoveChat }) => {
  return (
    <div className={`fixed inset-y-0 left-0 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} w-64 bg-[#2D2D2D] transition-transform duration-300 ease-in-out z-30`}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold">Chat History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-[#3D3D3D]"
            aria-label="Close sidebar"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-2">
          {Object.entries(chats).map(([chatId, chat]) => (
            <div key={chatId} className="flex items-center justify-between gap-2">
              <button 
                onClick={() => onChatSelect(chatId)}
                className={`flex-1 text-left text-gray-300 hover:bg-[#3D3D3D] p-2 rounded ${currentChatId === chatId ? 'bg-[#3D3D3D]' : ''}`}
              >
                {chat.name || `${new Date(chat.createdAt).toLocaleDateString()} - Chat ${chatId.slice(0, 8)}`}
              </button>
              <button
                onClick={() => onRemoveChat(chatId)}
                className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded hover:bg-[#3D3D3D]"
                aria-label="Remove chat"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SettingsModal = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState(settings);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
      <div className="bg-[#2D2D2D] p-6 rounded-lg w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2">API Key</label>
            <input
              type="text"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your Deepseek API key"
            />
          </div>
          <div>
            <label className="block text-white mb-2">API Base URL</label>
            <input
              type="text"
              value={formData.apiBase ?? "https://api.deepseek.com/chat/completions"}
              onChange={(e) => setFormData({ ...formData, apiBase: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter API base URL"
            />
          </div>
          <div>
            <label className="block text-white mb-2">Model Name</label>
            <input
              type="text"
              value={formData.model ?? "deepseek-chat"}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter model name"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-500 text-white rounded-lg px-4 py-2 hover:bg-green-600 transition-colors"
          >
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
};

const MessageActions = ({ message, onRegenerate, onEdit, isEditing, setIsEditing, editedContent, setEditedContent, onSaveEdit, isLongMessage, isExpanded, toggleExpand  }) => {
  if (message.type === "user") {
    return (
      <div className="flex gap-2 mt-2">
        {/* <button
          onClick={() => setIsEditing(true)}
          className="text-gray-400 hover:text-white text-sm"
        >
          Edit
        </button> */}
        <button
          onClick={onRegenerate}
          className="text-gray-400 hover:text-white text-sm"
        >
          Regenerate
        </button>
        {isLongMessage && (
                  <button
                    onClick={toggleExpand}
                     className="text-gray-400 hover:text-white text-sm"
                  >
                    {isExpanded ? "Show less" : "Show more"}
                  </button>
                )}
      </div>
    );
  }
  return null;
};

const ChatInterface = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("chats");
    return saved ? JSON.parse(saved) : {};
  });
  const [currentChatId, setCurrentChatId] = useState(() => {
    const savedChats = JSON.parse(localStorage.getItem("chats") || "{}");
    const chatIds = Object.entries(savedChats);
    if (chatIds.length > 0) {
      return chatIds.sort((a, b) => new Date(b[1].createdAt) - new Date(a[1].createdAt))[0][0];
    } else {
      const newChatId = Date.now().toString();
      return newChatId;
    }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const messagesEndRef = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedContent, setEditedContent] = useState("");

  const callDeepseekAPI = async (userMessage, onPartialResponse) => {
    setIsLoading(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch(settings.apiBase || "https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": userMessage}
          ],
          stream: true
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(line => line.trim() !== "");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || "";
              if (content) {
                fullResponse += content;
                onPartialResponse(fullResponse);
              }
            } catch (e) {
              console.error("Error parsing chunk:", e);
            }
          }
        }
      }
      
      return fullResponse;
    } catch (error) {
      if (error.name === "AbortError") {
        return "Response generation was cancelled.";
      }
      console.error("Error:", error);
      return "Sorry, there was an error processing your request.";
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  const createNewChat = () => {
    const newChatId = Date.now().toString();
    setChats(prev => ({
      ...prev,
      [newChatId]: {
        messages: [],
        createdAt: new Date().toISOString(),
        name: "Untitled Chat"
      }
    }));
    setCurrentChatId(newChatId);
    return newChatId;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
    scrollToBottom();
    
  }, [chats, currentChatId]);
  useEffect(() => {
    if (Object.keys(chats).length == 0) {
      createNewChat()  
    }
  }, [chats]);

  useEffect(() => {
    scrollToBottom();
  }, []);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("settings");
    return saved ? JSON.parse(saved) : {
      apiKey: "",
      model: "deepseek-chat",
      apiBase: "https://api.deepseek.com/chat/completions"
    };
  });

  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settings));
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      type: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setChats(prev => ({
      ...prev,
      [currentChatId]: {
        ...prev[currentChatId],
        messages: [...prev[currentChatId]?.messages, userMessage],
        name: prev[currentChatId]?.messages.length === 0 ? input.slice(0, 30) : prev[currentChatId]?.name
      }
    }));
    setInput("");

    const aiMessage = {
      type: "ai",
      content: "",
      timestamp: new Date().toISOString(),
    };

    setChats(prev => ({
      ...prev,
      [currentChatId]: {
        ...prev[currentChatId],
        messages: [...prev[currentChatId]?.messages, aiMessage]
      }
    }));

    const finalResponse = await callDeepseekAPI(input, (partialResponse) => {
      setChats(prev => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId],
          messages: prev[currentChatId]?.messages.map((msg, idx) => 
            idx === prev[currentChatId]?.messages.length - 1
              ? { ...msg, content: partialResponse }
              : msg
          )
        }
      }));
    });

    setChats(prev => ({
      ...prev,
      [currentChatId]: {
        ...prev[currentChatId],
        messages: prev[currentChatId]?.messages.map((msg, idx) => 
          idx === prev[currentChatId]?.messages.length - 1
            ? { ...msg, content: finalResponse }
            : msg
        )
      }
    }));
  };

  const clearChat = () => {
    setChats(prev => {
      const newChats = { ...prev };
      delete newChats[currentChatId];
      return newChats;
    });
    createNewChat();
  };

  const handleRegenerate = async (messageIndex) => {
    const messages = chats[currentChatId].messages;
    const userMessage = messages[messageIndex];
    
    setChats(prev => ({
      ...prev,
      [currentChatId]: {
        ...prev[currentChatId],
        messages: messages.slice(0, messageIndex + 1)
      }
    }));

    const aiMessage = {
      type: "ai",
      content: "",
      timestamp: new Date().toISOString(),
    };

    setChats(prev => ({
      ...prev,
      [currentChatId]: {
        ...prev[currentChatId],
        messages: [...prev[currentChatId]?.messages, aiMessage]
      }
    }));

    const finalResponse = await callDeepseekAPI(userMessage.content, (partialResponse) => {
      setChats(prev => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId],
          messages: prev[currentChatId]?.messages.map((msg, idx) => 
            idx === prev[currentChatId]?.messages.length - 1
              ? { ...msg, content: partialResponse }
              : msg
          )
        }
      }));
    });

    setChats(prev => ({
      ...prev,
      [currentChatId]: {
        ...prev[currentChatId],
        messages: prev[currentChatId]?.messages.map((msg, idx) => 
          idx === prev[currentChatId]?.messages.length - 1
            ? { ...msg, content: finalResponse }
            : msg
        )
      }
    }));
  };

  const handleEditMessage = (messageIndex) => {
    const message = chats[currentChatId].messages[messageIndex];
    setEditingMessageId(messageIndex);
    setEditedContent(message.content);
  };

  const handleSaveEdit = (messageIndex) => {
    setChats(prev => ({
      ...prev,
      [currentChatId]: {
        ...prev[currentChatId],
        messages: prev[currentChatId]?.messages.map((msg, idx) => 
          idx === messageIndex
            ? { ...msg, content: editedContent }
            : msg
        )
      }
    }));
    setEditingMessageId(null);
    setEditedContent("");
    handleRegenerate(messageIndex);
  };

  const MessageItem = ({ message, index }) => {
    const isAI = message.type === "ai";
    const [copyStatuses, setCopyStatuses] = useState({});
    const [isExpanded, setIsExpanded] = useState(false);
  
    // Function to toggle the expanded state
    const toggleExpand = () => {
      setIsExpanded(!isExpanded);
    };

    const copyToClipboard = (text, blockId) => {
      navigator.clipboard.writeText(text).then(() => {
        setCopyStatuses(prev => ({
          ...prev,
          [blockId]: "Copied!"
        }));
        setTimeout(() => {
          setCopyStatuses(prev => ({
            ...prev,
            [blockId]: null
          }));
        }, 2000); // Reset the status after 2 seconds
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        setCopyStatuses(prev => ({
          ...prev,
          [blockId]: "Failed to copy"
        }));
      });
    };
  
    // Determine if the message is too long (e.g., more than 5 lines)
    const isLongMessage = message.content.split("\n").length > 3;
  
    return (
      <div className={`flex w-full ${isAI ? "bg-[#525899]" : "bg-[#444654]"} p-4 rounded-lg mb-4`}>
        <div className="flex-shrink-0 mr-4">
          {isAI ? (
            <BiBot className="w-6 h-6 text-green-500" />
          ) : (
            <FaUser className="w-6 h-6 text-blue-500" />
          )}
        </div>
        <div className="flex-grow text-gray-50">
          <div className="prose prose-invert max-w-none">
            {editingMessageId === index ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="flex-1 bg-gray-700 text-white rounded px-2 py-1"
                />
                <button
                  onClick={() => handleSaveEdit(index)}
                  className="bg-green-500 text-white px-2 py-1 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingMessageId(null)}
                  className="bg-gray-500 text-white px-2 py-1 rounded"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className={`${!isAI && isLongMessage && !isExpanded ? "max-h-24 overflow-hidden" : ""}`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const blockId = Math.random().toString(36).substr(2, 9);
                      const isCodeBlockWithoutLangugue = String(children).includes("\n");
                      const isCodeBlock = match && isCodeBlockWithoutLangugue;
                      if (isCodeBlock || isCodeBlockWithoutLangugue) {
                        return (
                          <div className="relative">
                            <button
                              onClick={() => copyToClipboard(String(children), blockId)}
                              className={`absolute top-2 right-2 ${
                                copyStatuses[blockId] ? "bg-green-600" : "bg-gray-700 hover:bg-gray-600"
                              } text-white px-2 py-1 rounded text-sm transition-colors duration-200`}
                            >
                              {copyStatuses[blockId] || "Copy"}
                            </button>
                            <pre className="rounded-lg bg-gray-800 p-4 overflow-x-auto mb-4">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          </div>
                        );
                      }
                      return (
                        <code className="max-w-fit bg-gray-800 rounded-md px-1 py-0.5 text-gray-200" {...props}>
                          {children}
                        </code>
                      );
                    },
                    ul({ node, ...props }) {
                      return <ul className="list-disc list-inside space-y-1 my-2" {...props} />;
                    },
                    ol({ node, ...props }) {
                      return <ol className="list-decimal list-inside space-y-1 my-2" {...props} />;
                    },
                    li({ node, ...props }) {
                      return <li className="text-gray-200" {...props} />;
                    },
                    table({ node, ...props }) {
                      return <table className="min-w-full bg-gray-800 text-gray-200 border-collapse" {...props} />;
                    },
                    thead({ node, ...props }) {
                      return <thead className="bg-gray-700" {...props} />;
                    },
                    tbody({ node, ...props }) {
                      return <tbody {...props} />;
                    },
                    tr({ node, ...props }) {
                      return <tr className="border-b border-gray-600" {...props} />;
                    },
                    th({ node, ...props }) {
                      return (
                        <th
                          className="px-4 py-2 text-left font-semibold text-gray-300 uppercase tracking-wider"
                          {...props}
                        />
                      );
                    },
                    td({ node, ...props }) {
                      return <td className="px-4 py-2" {...props} />;
                    },
                    p({ node, ...props }) {
                      // Return the children directly without wrapping them in a <p> tag
                      return <span>{props.children}</span>;
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-2 text-right">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
          <MessageActions
            message={message}
            onRegenerate={() => handleRegenerate(index)}
            onEdit={() => handleEditMessage(index)}
            isEditing={editingMessageId === index}
            setIsEditing={setEditingMessageId}
            editedContent={editedContent}
            setEditedContent={setEditedContent}
            isLongMessage={isLongMessage}
            isExpanded={isExpanded}
            toggleExpand={() => toggleExpand(index)}
            onSaveEdit={() => handleSaveEdit(index)}
          />
        </div>
      </div>
    );
  };
  return (
    <div className="flex h-screen bg-[#202123]">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        chats={chats}
        currentChatId={currentChatId}
        onChatSelect={(chatId) => {
          setCurrentChatId(chatId);
          setIsSidebarOpen(false);
        }}
        onRemoveChat={(chatId) => {
          setChats(prev => {
            const newChats = { ...prev };
            delete newChats[chatId];
            return newChats;
          });
          if (chatId === currentChatId) {
            createNewChat();
          }
        }}
      />
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex flex-col flex-1">
        <div className="border-b border-gray-700 p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Open sidebar"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Open settings"
            >
              <FiSettings className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={createNewChat}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4" role="log" aria-label="Chat history">
          {chats[currentChatId]?.messages.map((message, index) => (
            <MessageItem key={index} message={message} index={index} />
          ))}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-700 p-4">
          <div className="max-w-4xl mx-auto flex gap-4">
            <button
              onClick={clearChat}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Clear chat history"
            >
              <FiTrash2 className="w-6 h-6" />
            </button>
            <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Message input"
            />
              {isLoading ? (
                <button
                  onClick={handleStop}
                  type="button"
                  className="bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-600 transition-colors"
                  aria-label="Stop generation"
                >
                  <FiSquare className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="bg-green-500 text-white rounded-lg px-4 py-2 hover:bg-green-600 transition-colors disabled:opacity-50"
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                >
                  <FiSend className="w-5 h-5" />
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
