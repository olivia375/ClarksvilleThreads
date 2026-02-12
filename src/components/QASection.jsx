import React, { useState } from "react";
import { integrations } from "@/api/gcpClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function QASection() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const userQuestion = question.trim();
    setQuestion("");
    
    // Add user message
    const newUserMessage = { role: "user", content: userQuestion };
    setMessages(prev => [...prev, newUserMessage]);
    
    setIsLoading(true);

    try {
      const response = await integrations.Core.InvokeLLM({
        prompt: `You are a helpful assistant for CommunityConnect, a volunteer platform connecting volunteers with local businesses and nonprofits. 
        
Answer the following question about volunteering, community service, or how to use the platform. Be friendly, concise, and encouraging. 
If the question is about how to volunteer, mention that users can browse businesses in the Explore page, check opportunities in the Opportunities page, and complete their volunteer profile.

Question: ${userQuestion}`,
      });

      const botMessage = { role: "assistant", content: response };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = { 
        role: "assistant", 
        content: "Sorry, I'm having trouble answering right now. Please try again!" 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <MessageCircle className="w-6 h-6 text-emerald-600" />
          Ask Us Anything
        </CardTitle>
        <p className="text-gray-600">
          Have questions about volunteering or our platform? Ask away!
        </p>
      </CardHeader>
      <CardContent>
        {/* Chat Messages */}
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-gray-400"
              >
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Start by asking a question below!</p>
              </motion.div>
            )}
            
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-emerald-600" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] p-4 rounded-xl ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                )}
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="bg-gray-100 p-4 rounded-xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Question Input */}
        <form onSubmit={handleAskQuestion} className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about volunteering..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Suggested Questions */}
        {messages.length === 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "How do I start volunteering?",
                "What skills are most needed?",
                "Can I volunteer remotely?",
                "How are volunteer hours tracked?"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuestion(suggestion)}
                  className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full hover:bg-emerald-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}