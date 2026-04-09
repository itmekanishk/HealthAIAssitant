import React, { useState } from 'react';
import { BookOpen, Loader, AlertCircle } from 'lucide-react';
import { explainMedicalTerm, validateMedicalTerm } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';
import { PageContainer } from './ui/PageContainer';
export default function MedicalTermExplainer() {
    const [term, setTerm] = useState('');
    const [explanation, setExplanation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleExplain = async (e) => {
        e.preventDefault();
        if (!term.trim()) {
            setError('Please enter a medical term to explain.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            // Validate if the input is a legitimate medical term
            const isValidMedicalTerm = await validateMedicalTerm(term);
            if (!isValidMedicalTerm) {
                setError('⚠️ The input you provided is not recognized as a valid medical term. Please enter a valid term or code.');
                setExplanation('');
                return;
            }
            const result = await explainMedicalTerm(term);
            setExplanation(result);
        }
        catch (error) {
            setError(error instanceof Error ? error.message : 'Error explaining term. Please try again.');
            setExplanation('');
        }
        finally {
            setLoading(false);
        }
    };
    return (<PageContainer size="sm" icon={<BookOpen className="w-6 h-6 text-primary"/>} title="Medical Term Explainer" description="Type a term or code and get a clear, plain-language explanation.">

      <form onSubmit={handleExplain} className="space-y-4">
        <div className="relative">
          <input type="text" value={term} onChange={(e) => {
            setTerm(e.target.value);
            setError('');
        }} className="w-full h-12 px-4 pr-12 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground" placeholder="Enter a medical term..."/>
          {term && (<button type="button" onClick={() => {
                setTerm('');
                setError('');
            }} className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <span className="text-xl leading-none">×</span>
            </button>)}
        </div>

        {error && (<div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5"/>
            <span>{error}</span>
          </div>)}

        <button type="submit" disabled={loading || !term.trim()} className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors duration-200">
          {loading ? (<>
              <Loader className="w-5 h-5 animate-spin"/>
              Explaining...
            </>) : ('Explain Term')}
        </button>
      </form>

      {explanation && (<div className="mt-6 p-6 bg-muted/40 rounded-lg border border-border/60">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Explanation:</h3>
          <div className="prose prose-blue max-w-none">
            <ReactMarkdown>{explanation}</ReactMarkdown>
          </div>
        </div>)}

      <div className="mt-8 p-4 bg-primary/10 rounded-lg border border-primary/20">
        <h4 className="text-sm font-semibold text-foreground mb-1">Tip</h4>
        <p className="text-sm text-muted-foreground">
          You can enter medical terms in multiple languages. The explanation will be provided in the same language as your input.
        </p>
      </div>
    </PageContainer>);
}
