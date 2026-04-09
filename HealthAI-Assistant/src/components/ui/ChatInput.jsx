import React from 'react';
import { Send, Loader } from 'lucide-react';
export function ChatInput({ input, setInput, handleSubmit, loading }) {
    return (<form onSubmit={handleSubmit} className="flex gap-3 p-4 bg-card/50 border-t border-border/60">
      <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your health-related question..." className="flex-1 h-12 px-4 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 placeholder:text-muted-foreground" disabled={loading} aria-label="Chat input"/>
      <button type="submit" disabled={loading || !input.trim()} className="px-6 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0" aria-label={loading ? "Sending message..." : "Send message"}>
        {loading ? (<>
            <Loader className="w-5 h-5 animate-spin"/>
            <span className="hidden sm:inline">Sending...</span>
          </>) : (<>
            <Send className="w-5 h-5"/>
            <span className="hidden sm:inline">Send</span>
          </>)}
      </button>
    </form>);
}
