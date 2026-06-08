import { useState, useEffect, useRef, useCallback } from 'react';
import { aiAPI, classAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const QUICK_QUESTIONS = [
  'Giải thích cho tôi hiểu về chủ đề này?',
  'Tôi không hiểu bước này, giải thích lại được không?',
  'Gợi ý cho tôi cách tiếp cận bài này?',
  'Bài này liên quan đến kiến thức nào?',
];

export default function AIChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    document.title = 'AI Trợ Lý - EduSmart';
    classAPI.getAll().then(r => setClasses(r.data || [])).catch(() => {});
    aiAPI.getChatHistory().then(r => setChatHistory(r.data || [])).catch(() => {});

    // Welcome message
    setMessages([{
      role: 'assistant',
      content: `Xin chào **${user?.name}**! 👋\n\nMình là AI Trợ Lý Học Tập của EduSmart. Mình có thể giúp bạn:\n\n• 🧠 **Giải thích** các khái niệm khó\n• 💡 **Gợi ý** cách tiếp cận bài tập\n• 📖 **Tóm tắt** nội dung tài liệu\n• ❓ **Đặt câu hỏi** để kích thích tư duy\n\n> ⚠️ **Lưu ý**: Mình sẽ hướng dẫn bạn tự tư duy, không đưa đáp án trực tiếp!\n\nHãy chọn lớp học và bắt đầu hỏi nhé! 🚀`,
      timestamp: new Date(),
    }]);
  }, [user?.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await aiAPI.chat({
        message: msg,
        chatId,
        classId: selectedClass || undefined,
      });

      if (!chatId && res.data?.chatId) {
        setChatId(res.data.chatId);
      }

      const aiMsg = {
        role: 'assistant',
        content: res.data?.reply || 'Xin lỗi, có lỗi xảy ra.',
        sources: res.data?.sources || [],
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMsg]);
      aiAPI.getChatHistory().then(r => setChatHistory(r.data || [])).catch(() => {});
    } catch (err) {
      toast.error('Không thể kết nối AI. Vui lòng thử lại.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Xin lỗi, có lỗi kết nối. Hãy thử lại sau nhé!',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, chatId, selectedClass]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = () => {
    setChatId(null);
    setMessages([{
      role: 'assistant',
      content: 'Cuộc trò chuyện mới bắt đầu! Bạn muốn hỏi về chủ đề gì? 😊',
      timestamp: new Date(),
    }]);
  };

  const loadChat = async (id) => {
    try {
      const res = await aiAPI.getChat(id);
      setChatId(id);
      setMessages(res.data?.messages || []);
      setSidebarOpen(false);
    } catch {
      toast.error('Không thể tải cuộc trò chuyện.');
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] rounded-2xl overflow-hidden bg-white shadow-lg border border-slate-100">
      {/* Chat History Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-slate-100 bg-slate-50 flex flex-col`}>
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-700 text-sm">Lịch sử chat</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <button onClick={startNewChat} className="btn btn-primary w-full btn-sm">
            + Cuộc trò chuyện mới
          </button>
          {chatHistory.map(chat => (
            <button
              key={chat._id}
              onClick={() => loadChat(chat._id)}
              className={`w-full text-left p-3 rounded-xl text-sm hover:bg-white transition-colors ${chatId === chat._id ? 'bg-primary-50 text-primary-700' : 'text-slate-600'}`}
            >
              <p className="font-medium line-clamp-1">{chat.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{chat.totalMessages} tin nhắn</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-white">
          <button
            onClick={() => setSidebarOpen(p => !p)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            title="Lịch sử chat"
          >
            📋
          </button>
          <div className="flex-1 min-w-[200px]">
            <h1 className="font-bold text-slate-800 truncate">🤖 AI Trợ Lý Học Tập</h1>
            <p className="text-xs text-slate-400 truncate">Hướng dẫn học tập thông minh • Không đưa đáp án</p>
          </div>
          {/* Class selector */}
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="form-input max-w-xs text-xs py-2 truncate"
          >
            <option value="">🌐 Kiến thức chung</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name} - {c.subject}</option>
            ))}
          </select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" id="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-lg flex-shrink-0">
                  🤖
                </div>
              )}
              <div className={`max-w-xl ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
                {msg.sources?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs text-slate-400 mb-2">📖 Nguồn tài liệu:</p>
                    {msg.sources.map((s, si) => (
                      <div key={si} className="bg-slate-50 rounded-lg p-2 mb-1">
                        <p className="text-xs font-medium text-primary-700">{s.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{s.excerpt}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs opacity-40 mt-2 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className="w-9 h-9 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0 overflow-hidden">
                  {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user?.name?.[0]}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">🤖</div>
              <div className="chat-bubble-ai">
                <div className="flex gap-1.5 items-center py-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick questions */}
        {messages.length <= 1 && (
          <div className="px-6 pb-3 flex gap-2 flex-wrap">
            {QUICK_QUESTIONS.map(q => (
              <button key={q} onClick={() => sendMessage(q)} className="btn btn-secondary btn-sm text-xs">
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                id="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi AI về bài học, bài tập... (Enter để gửi, Shift+Enter xuống dòng)"
                className="form-input resize-none min-h-[52px] max-h-32 pr-4"
                rows={1}
                style={{lineHeight: '1.5'}}
              />
            </div>
            <button
              id="chat-send"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="btn btn-primary h-[52px] px-5 flex-shrink-0"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : '➤'}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            🛡️ AI sẽ hướng dẫn bạn tư duy, không cung cấp đáp án trực tiếp
          </p>
        </div>
      </div>
    </div>
  );
}
