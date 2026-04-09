import { Routes, Route } from 'react-router-dom';
import SymptomAnalyzer from './SymptomAnalyzer';
import DrugInteraction from './DrugInteraction';
import MedicalTermExplainer from './MedicalTermExplainer';
import ReportSummarizer from './ReportSummarizer';
import PolicyQueryAssistant from './PolicyQueryAssistant';
import About from './About';
import Homepage from './Homepage';
import HealthcareChat from './HealthcareChat';
import Emergency from './Emergency';
import MedicalImageAnalyzer from './MedicalImageAnalyzer';
import MedicineAnalyzer from './MedicineAnalyzer';
import { Navbar } from './navigation/Navbar';
import HealthcareLogo from './HealthcareLogo';
export default function AppContent() {
    return (<div className="flex flex-col min-h-screen bg-background bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.10),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_55%)] transition-colors duration-200">
      <Navbar />

      <main className="flex-grow pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="w-full animate-fadeIn">
              <Routes>
                <Route path="/" element={<Homepage />}/>
                <Route path="/symptom-analyzer" element={<SymptomAnalyzer />}/>
                <Route path="/drug-interactions" element={<DrugInteraction />}/>
                <Route path="/medical-terms" element={<MedicalTermExplainer />}/>
                <Route path="/medical-image-analyzer" element={<MedicalImageAnalyzer />}/>
                <Route path="/medicine-analyzer" element={<MedicineAnalyzer />}/>
                <Route path="/chat" element={<HealthcareChat />}/>
                <Route path="/report-summarizer" element={<ReportSummarizer />}/>
                <Route path="/policy-query" element={<PolicyQueryAssistant />}/>
                <Route path="/emergency" element={<Emergency />}/>
                <Route path="/about" element={<About />}/>
              </Routes>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border/60 shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600">
              <HealthcareLogo className="w-5 h-5 text-white"/>
            </div>
            <span className="text-foreground font-semibold text-sm sm:text-base">HealthAI Assistant</span>
            <span className="text-muted-foreground text-xs sm:text-sm">© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>);
}
