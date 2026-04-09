import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileText, Upload, MessageSquare, Send, Loader, Bot, User, AlertCircle } from 'lucide-react';
import { extractTextFromPdf } from '../utils/pdfUtils';
import { queryPolicyDocument, validatePolicyDocument } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';
import { useDropzone } from 'react-dropzone';
import { PageContainer } from './ui/PageContainer';
export default function PolicyQueryAssistant() {
    const [policyText, setPolicyText] = useState('');
    const [fileName, setFileName] = useState('');
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file)
            return;
        setUploadLoading(true);
        setFileName(file.name);
        setError('');
        setMessages([]);
        try {
            // Extract text from PDF
            const text = await extractTextFromPdf(file);
            // Validate if the document is a health policy
            const isValidPolicy = await validatePolicyDocument(text);
            if (!isValidPolicy) {
                setError('⚠️ Invalid document. Please upload a valid health policy PDF.');
                setPolicyText('');
                setFileName('');
                return;
            }
            // If valid, proceed with processing
            setPolicyText(text);
            setMessages([{
                    type: 'bot',
                    content: `✅ **Policy document "${file.name}" has been successfully uploaded and processed!**\n\nYou can now ask me questions about your policy. For example:\n- "46-year-old male, knee surgery in Pune, 3-month-old insurance policy"\n- "What is covered under maternity benefits?"\n- "What are the waiting periods for pre-existing conditions?"`,
                    timestamp: new Date(),
                }]);
        }
        catch (error) {
            console.error(error);
            setError('Error processing the policy document. Please try again.');
            setPolicyText('');
            setFileName('');
        }
        finally {
            setUploadLoading(false);
        }
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
        },
        multiple: false,
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading || !policyText)
            return;
        const userMessage = {
            type: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setError('');
        // Add typing indicator
        const typingMessage = {
            type: 'bot',
            content: '...',
            timestamp: new Date(),
            isTyping: true,
        };
        setMessages(prev => [...prev, typingMessage]);
        try {
            const response = await queryPolicyDocument(userMessage.content, policyText);
            // Remove typing indicator and add actual response
            setMessages(prev => {
                const filtered = prev.filter(msg => !msg.isTyping);
                return [...filtered, {
                        type: 'bot',
                        content: response,
                        timestamp: new Date(),
                    }];
            });
        }
        catch (error) {
            console.error(error);
            setError('Failed to process your query. Please try again.');
            setMessages(prev => {
                const filtered = prev.filter(msg => !msg.isTyping);
                return [...filtered, {
                        type: 'bot',
                        content: 'I apologize, but I encountered an error processing your query. Please try again.',
                        timestamp: new Date(),
                    }];
            });
        }
        setLoading(false);
    };
    const renderChatInterface = () => (<div className="mt-6 flex flex-col h-[500px] bg-card/70 rounded-2xl border border-border/60">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && policyText && (<div className="text-center text-muted-foreground mt-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-primary"/>
            <p className="text-lg font-medium text-foreground">Policy Assistant Ready</p>
            <p className="mt-2">Ask me anything about your uploaded policy document.</p>
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
                    <span className="text-muted-foreground">Analyzing policy...</span>
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
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 p-4 bg-card/50 border-t border-border/60">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your policy (e.g., '46M, knee surgery, Pune, 3-month policy')" className="flex-1 h-12 px-4 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 placeholder:text-muted-foreground" disabled={loading || !policyText}/>
        <button type="submit" disabled={loading || !input.trim() || !policyText} className="px-6 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200">
          {loading ? (<>
              <Loader className="w-5 h-5 animate-spin"/>
              <span className="hidden sm:inline">Processing...</span>
            </>) : (<>
              <Send className="w-5 h-5"/>
              <span className="hidden sm:inline">Ask</span>
            </>)}
        </button>
      </form>
    </div>);
    return (<PageContainer icon={<FileText className="w-6 h-6 text-primary"/>} title="Policy Query Assistant" description="Upload your policy PDF and ask coverage questions in plain language.">
      <div className="space-y-6">
        {/* Upload Section */}
        <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${isDragActive
            ? 'border-primary bg-primary/10'
            : 'border-input hover:border-primary/60'} ${policyText ? 'bg-green-500/10 border-green-500/30' : 'bg-card/40'}`}>
          <input {...getInputProps()}/>
          <Upload className={`mx-auto h-12 w-12 ${policyText ? 'text-green-400' : 'text-muted-foreground'}`}/>
          {uploadLoading ? (<div className="mt-4">
              <Loader className="w-6 h-6 animate-spin mx-auto text-primary"/>
              <p className="mt-2 text-sm text-primary">Processing policy document...</p>
            </div>) : policyText ? (<div className="mt-4">
              <p className="text-sm text-green-400 font-medium">✅ Policy document uploaded successfully!</p>
              <p className="text-xs text-muted-foreground mt-1">{fileName}</p>
              <p className="text-xs text-muted-foreground mt-2">Click to upload a different document</p>
            </div>) : (<div className="mt-4">
              <p className="text-sm text-foreground/80">
                Drag and drop your policy PDF here, or click to select
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supports PDF files up to 50MB
              </p>
            </div>)}
        </div>

        {error && (<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5"/>
            <span>{error}</span>
          </div>)}

        {/* Instructions */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-3">How to Use</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>1. Upload:</strong> Upload your policy document (PDF format)</p>
            <p><strong>2. Query:</strong> Ask questions in natural language about your policy</p>
            <p><strong>3. Get Answers:</strong> Receive detailed responses with policy clause references</p>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium text-foreground mb-2">Sample Queries</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• "46-year-old male, knee surgery in Pune, 3-month-old insurance policy"</li>
              <li>• "What is the waiting period for pre-existing conditions?"</li>
              <li>• "Are dental procedures covered under this policy?"</li>
              <li>• "What is the maximum claim amount for hospitalization?"</li>
            </ul>
          </div>
        </div>

        {/* Chat Interface */}
        {policyText && renderChatInterface()}
      </div>
    </PageContainer>);
}
