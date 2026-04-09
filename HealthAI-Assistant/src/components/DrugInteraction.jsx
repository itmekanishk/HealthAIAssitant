import React, { useState } from 'react';
import { Pill, Plus, X, Loader, AlertCircle } from 'lucide-react';
import { checkDrugInteraction, validateMedicationName } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';
import { PageContainer } from './ui/PageContainer';
export default function DrugInteraction() {
    const [drugs, setDrugs] = useState([]);
    const [currentDrug, setCurrentDrug] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [validating, setValidating] = useState(false);
    const addDrug = async () => {
        const drugName = currentDrug.trim();
        if (!drugName) {
            return;
        }
        if (drugs.includes(drugName)) {
            setError('This medication has already been added.');
            return;
        }
        setValidating(true);
        setError('');
        try {
            const isValid = await validateMedicationName(drugName);
            if (!isValid) {
                setError('⚠️ Invalid input. Please enter a valid medication name.');
                setValidating(false);
                return;
            }
            setDrugs([...drugs, drugName]);
            setCurrentDrug('');
            setError('');
        }
        catch (error) {
            setError('Error validating medication name. Please try again.');
        }
        finally {
            setValidating(false);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addDrug();
        }
    };
    const removeDrug = (index) => {
        setDrugs(drugs.filter((_, i) => i !== index));
        setError('');
    };
    const handleCheck = async () => {
        if (drugs.length < 1) {
            setError('Please enter at least one medication to analyze.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await checkDrugInteraction(drugs);
            setAnalysis(result);
        }
        catch (error) {
            setError(error instanceof Error ? error.message : 'Error analyzing medications. Please try again.');
            setAnalysis('');
        }
        setLoading(false);
    };
    return (<PageContainer size="sm" icon={<Pill className="w-6 h-6 text-primary"/>} title="Drug Interaction Checker" description="Add one or more medicines to get safety details and interaction insights.">

      <div className="flex gap-2 mb-4">
        <input type="text" value={currentDrug} onChange={(e) => setCurrentDrug(e.target.value)} onKeyPress={handleKeyPress} disabled={validating} className="flex-1 h-12 px-4 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 placeholder:text-muted-foreground" placeholder="Enter medication name and press Enter"/>
        <button onClick={addDrug} disabled={validating} className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
          {validating ? <Loader className="w-5 h-5 animate-spin"/> : <Plus className="w-5 h-5"/>}
        </button>
      </div>

      {error && (<div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5"/>
          <span>{error}</span>
        </div>)}

      <div className="flex flex-wrap gap-2 mb-4 min-h-[50px]">
        {drugs.map((drug, index) => (<div key={index} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full group hover:bg-muted/80 transition-colors duration-200">
            <span className="text-foreground/80">{drug}</span>
            <button onClick={() => removeDrug(index)} className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors duration-200">
              <X className="w-4 h-4"/>
            </button>
          </div>))}
      </div>

      <button onClick={handleCheck} disabled={loading || drugs.length < 1} className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors duration-200">
        {loading ? (<>
            <Loader className="w-5 h-5 animate-spin"/>
            {drugs.length === 1 ? 'Analyzing Medication...' : 'Checking Interactions...'}
          </>) : (drugs.length === 1 ? 'Get Medication Info' : 'Check Interactions')}
      </button>

      {analysis && (<div className="mt-6 p-4 bg-muted/40 rounded-lg border border-border/60">
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            {drugs.length === 1 ? 'Medication Information:' : 'Interaction Analysis:'}
          </h3>
          <div className="prose prose-blue max-w-none dark:prose-invert">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
        </div>)}
    </PageContainer>);
}
