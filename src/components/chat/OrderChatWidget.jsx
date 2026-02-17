import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader2, Package } from "lucide-react";
import MessageBubble from './MessageBubble';

export default function OrderChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'order_tracker',
        metadata: {
          name: 'Order Tracking Chat',
          started_at: new Date().toISOString(),
        }
      });
      setConversation(conv);
      setMessages([{
        role: 'assistant',
        content: "👋 Hi! I'm your EarthGoods order assistant. I can help you track orders, check delivery status, and answer shipping questions. What's the email you used for your order?"
      }]);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && !conversation) {
      startConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!conversation?.id) return;
    
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });

    return () => unsubscribe();
  }, [conversation?.id]);

  const sendMessage = async () => {
    if (!input.trim() || !conversation || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-all hover:scale-105 flex items-center justify-center ${isOpen ? 'hidden' : ''}`}
      >
        <Package className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-stone-200">
          {/* Header */}
          <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Order Tracking</h3>
                <p className="text-xs text-emerald-100">We typically reply instantly</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-center gap-2 text-stone-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Checking your order...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-stone-200 bg-white">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your order..."
                className="flex-1 rounded-full"
                disabled={isLoading || !conversation}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading || !conversation}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}