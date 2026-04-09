import React from 'react';
import { Github, Globe, Mail } from 'lucide-react';
import { PageContainer } from './ui/PageContainer';
export default function About() {
    return (<PageContainer icon={<Globe className="w-6 h-6 text-primary"/>} title="About HealthAI Assistant" description="What this project is, who built it, and what it uses.">
      <div className="max-w-2xl mx-auto space-y-8">
        <section className="prose prose-blue max-w-none">
          <h3 className="text-2xl font-semibold text-foreground mb-3">About the Project</h3>
          <p className="text-muted-foreground">
            HealthAI Assistant is an innovative healthcare analysis tool that leverages the power of Google's Gemini AI to provide intelligent health-related insights. The project aims to make medical information more accessible and understandable for everyone through features like symptom analysis, drug interaction checking, medical term explanation, and report summarization.
          </p>
        </section>

        <section>
          <h3 className="text-2xl font-semibold text-foreground mb-4">About the Developer</h3>
          <div className="bg-card/70 border border-border/60 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <img src="" alt="Kanishk" className="w-24 h-24 rounded-full object-cover border-4 border-border shadow-lg shadow-black/30"/>
              <div>
                <h4 className="text-xl font-bold text-foreground">Kanishk</h4>
                <p className="text-muted-foreground mt-2">
                  Full Stack Developer passionate about creating innovative solutions in healthcare technology. Specialized in building user-friendly applications that make a difference in people's lives.
                </p>
                <div className="flex flex-wrap gap-4 mt-4">
                  <a href="" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Globe className="w-5 h-5"/>
                    <span>Portfolio</span>
                  </a>
                  <a href="" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Github className="w-5 h-5"/>
                    <span>GitHub</span>
                  </a>
                  <a href="" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="w-5 h-5"/>
                    <span>Contact</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-2xl font-semibold text-foreground mb-3">Technologies Used</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>React with Javascript for the frontend</li>
            <li>Tailwind CSS for styling</li>
            <li>Google's Gemini AI API for intelligent analysis</li>
            <li>Lucide React for beautiful icons</li>
            <li>React Markdown for formatted text rendering</li>
          </ul>
        </section>
      </div>
    </PageContainer>);
}
