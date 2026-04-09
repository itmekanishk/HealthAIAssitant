import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Loader } from 'lucide-react';
export function MessageList({ messages, messagesEndRef }) {
    return (<div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (<div className="text-center text-muted-foreground mt-4">
          <Bot className="w-12 h-12 mx-auto mb-4 text-primary"/>
          <p className="text-lg font-medium text-foreground">Hello! I'm your healthcare assistant.</p>
          <p className="mt-2">Ask me anything about health, medical conditions, or wellness!</p>
        </div>)}
      
      {messages.map((message, index) => (<div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'user' ? 'bg-primary/15 border border-primary/20' : 'bg-muted border border-border/60'}`}>
              {message.type === 'user' ? (<User className="w-5 h-5 text-primary"/>) : (<Bot className="w-5 h-5 text-muted-foreground"/>)}
            </div>
            <div className={`p-4 rounded-lg ${message.type === 'user'
                ? 'bg-primary/15 text-foreground border border-primary/20'
                : 'bg-background/40 border border-border/60 text-foreground'}`}>
              {message.isTyping ? (<div className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin text-primary"/>
                  <span className="text-muted-foreground">Thinking...</span>
                </div>) : (<>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </>)}
            </div>
          </div>
        </div>))}
      <div ref={messagesEndRef}/>
    </div>);
}
