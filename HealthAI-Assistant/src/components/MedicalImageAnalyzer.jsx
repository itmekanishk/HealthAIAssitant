import React, { useState } from 'react';
import { Camera, Upload, Send, AlertTriangle, Loader, Activity, TrendingUp, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { analyzeMedicalImage, validateMedicalImage } from '../lib/gemini';
import { PageContainer } from './ui/PageContainer';
export default function MedicalImageAnalyzer() {
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState('');
    const [validationWarning, setValidationWarning] = useState('');
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                setImage(file);
                const reader = new FileReader();
                reader.onload = (evt) => {
                    setImagePreview(evt.target?.result);
                };
                reader.readAsDataURL(file);
                setError('');
                setValidationWarning('');
                // Validate if it's a medical image
                validateUploadedImage(file);
            }
            else {
                setError('Please upload a valid image file');
            }
        }
    };
    const validateUploadedImage = async (file) => {
        setValidating(true);
        try {
            const base64Image = await convertImageToBase64(file);
            const validation = await validateMedicalImage(base64Image);
            if (!validation.isValid) {
                setValidationWarning(validation.message);
            }
            else {
                setValidationWarning('');
            }
        }
        catch (err) {
            console.error('Validation error:', err);
            // Continue even if validation fails
        }
        finally {
            setValidating(false);
        }
    };
    const convertImageToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };
    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!image) {
            setError('Please upload a medical image');
            return;
        }
        // If there's a validation warning, prevent analysis
        if (validationWarning) {
            setError('Cannot analyze non-medical images. Please upload a valid medical image (X-ray, CT scan, MRI, ultrasound, ECG, etc.).');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const base64Image = await convertImageToBase64(image);
            // Final validation before analysis
            const validation = await validateMedicalImage(base64Image);
            if (!validation.isValid) {
                setError(validation.message + '\n\nPlease upload a valid medical image such as X-rays, CT scans, MRI, ultrasound, or ECG images.');
                setLoading(false);
                return;
            }
            const result = await analyzeMedicalImage(base64Image, additionalInfo.trim());
            setAnalysis(result);
        }
        catch (err) {
            console.error(err);
            setError('Failed to analyze medical image. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const getSeverityColor = (severity) => {
        const colors = {
            Normal: 'bg-green-500 text-white',
            Mild: 'bg-yellow-500 text-gray-900',
            Moderate: 'bg-orange-500 text-white',
            Severe: 'bg-red-500 text-white',
            Critical: 'bg-red-700 text-white'
        };
        return colors[severity] || 'bg-gray-500 text-white';
    };
    const getUrgencyColor = (urgency) => {
        const colors = {
            Low: 'bg-green-500 text-white',
            Medium: 'bg-yellow-500 text-gray-900',
            High: 'bg-red-500 text-white'
        };
        return colors[urgency] || 'bg-gray-500 text-white';
    };
    return (<PageContainer icon={<Camera className="w-6 h-6 text-primary"/>} title="Medical Image Analyzer" description="Upload an X-ray/CT/MRI/ultrasound/ECG image and get an AI summary." size="md">

            <form onSubmit={handleAnalyze} className="space-y-4">
                <div className="border-2 border-dashed border-input rounded-2xl p-8 text-center bg-card/40">
                    {imagePreview ? (<div className="space-y-4">
                            <img src={imagePreview} alt="Medical image preview" className="max-h-64 mx-auto rounded-2xl border-2 border-border/60"/>
                            <button type="button" onClick={() => {
                setImage(null);
                setImagePreview(null);
            }} className="px-4 py-2 border-2 border-input rounded-lg hover:bg-muted transition-colors text-foreground">
                                Remove Image
                            </button>
                        </div>) : (<div className="space-y-4">
                            <Upload className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500"/>
                            <div>
                                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Upload Medical Image
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    X-Ray, CT Scan, MRI, Ultrasound, ECG - PNG, JPG up to 10MB
                                </p>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="medical-image-upload"/>
                                    <label htmlFor="medical-image-upload">
                                    <span className="cursor-pointer inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                                        Choose Image
                                    </span>
                                </label>
                            </div>
                        </div>)}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Additional Context (Optional)
                    </label>
                    <textarea value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} className="w-full h-24 p-4 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none placeholder:text-muted-foreground" placeholder="Enter patient age, symptoms, medical history, or specific areas of concern..."/>
                </div>

                {validationWarning && (<div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"/>
                            <div className="flex-1">
                                <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-1">⚠️ Not a Medical Image</h4>
                                <p className="text-sm text-orange-700 dark:text-orange-400 mb-2">{validationWarning}</p>
                                <p className="text-sm text-orange-800 dark:text-orange-300 font-medium">
                                    📋 Please upload valid medical images such as:
                                </p>
                                <ul className="text-sm text-orange-700 dark:text-orange-400 mt-1 ml-4 list-disc">
                                    <li>X-rays (chest, bone, dental)</li>
                                    <li>CT scans</li>
                                    <li>MRI scans</li>
                                    <li>Ultrasound images</li>
                                    <li>ECG/EKG charts</li>
                                </ul>
                            </div>
                        </div>
                    </div>)}

                {error && (<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"/>
                        <p className="text-red-600 dark:text-red-400 whitespace-pre-line">{error}</p>
                    </div>)}

                <button type="submit" disabled={loading || !image || validating || !!validationWarning} className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors duration-200">
                    {validating ? (<>
                            <Loader className="w-5 h-5 animate-spin"/>
                            Validating Image...
                        </>) : loading ? (<>
                            <Loader className="w-5 h-5 animate-spin"/>
                            Analyzing Medical Image...
                        </>) : (<>
                            <Send className="w-5 h-5"/>
                            Analyze Medical Image
                        </>)}
                </button>
            </form>

            {analysis && (<div className="mt-6 space-y-6">
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-semibold text-foreground">
                                    {analysis.imageType} - {analysis.bodyPart}
                                </h3>
                            </div>
                            <div className="flex gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(analysis.overallAssessment.urgencyLevel)}`}>
                                    {analysis.overallAssessment.urgencyLevel} Urgency
                                </span>
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-muted text-foreground">
                                    {analysis.confidence}% Confidence
                                </span>
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg border-2 ${analysis.overallAssessment.status === 'Normal'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                : analysis.overallAssessment.status === 'Attention Needed'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-500'}`}>
                            <h4 className="font-semibold text-foreground mb-2">
                                Status: {analysis.overallAssessment.status}
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300">{analysis.overallAssessment.summary}</p>
                        </div>
                    </div>

                    {analysis.keyFindings.length > 0 && (<div className="p-6 bg-card/70 rounded-2xl border border-border/60">
                            <div className="flex items-center gap-2 mb-4">
                                <Activity className="w-5 h-5 text-blue-600"/>
                                <h3 className="text-lg font-semibold text-foreground">Key Findings</h3>
                            </div>
                            <div className="space-y-4">
                                {analysis.keyFindings.map((finding, idx) => (<div key={idx} className="p-4 bg-background/40 rounded-lg border border-border/60">
                                        <div className="flex justify-between items-start mb-2">
                                            <h5 className="font-semibold text-foreground">{finding.finding}</h5>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(finding.severity)}`}>
                                                {finding.severity}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            <strong>Location:</strong> {finding.location}
                                        </p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            <strong>Significance:</strong> {finding.significance}
                                        </p>
                                    </div>))}
                            </div>
                        </div>)}

                    {analysis.redFlags.length > 0 && (<div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-500">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertCircle className="w-5 h-5 text-red-600"/>
                                <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Critical Alerts</h3>
                            </div>
                            <div className="space-y-2">
                                {analysis.redFlags.map((flag, idx) => (<div key={idx} className="p-3 bg-red-100 dark:bg-red-900/40 rounded border border-red-300 dark:border-red-700">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0"/>
                                            <p className="text-red-800 dark:text-red-300">{flag}</p>
                                        </div>
                                    </div>))}
                            </div>
                        </div>)}

                    {analysis.differentialDiagnosis.length > 0 && (<div className="p-6 bg-card/70 rounded-2xl border border-border/60">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-blue-600"/>
                                <h3 className="text-lg font-semibold text-foreground">Differential Diagnosis</h3>
                            </div>
                            <div className="space-y-2">
                                {analysis.differentialDiagnosis.map((diagnosis, idx) => (<div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center gap-2">
                                            <ArrowRight className="w-4 h-4 text-blue-600 flex-shrink-0"/>
                                            <p className="text-foreground">{diagnosis}</p>
                                        </div>
                                    </div>))}
                            </div>
                        </div>)}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {analysis.recommendations.immediate.length > 0 && (<div className="p-6 bg-card/70 rounded-2xl border border-border/60">
                                <h3 className="text-lg font-semibold text-foreground mb-4">Immediate Actions</h3>
                                <div className="space-y-2">
                                    {analysis.recommendations.immediate.map((action, idx) => (<div key={idx} className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0"/>
                                                <p className="text-foreground">{action}</p>
                                            </div>
                                        </div>))}
                                </div>
                            </div>)}

                        {analysis.recommendations.followUp.length > 0 && (<div className="p-6 bg-card/70 rounded-2xl border border-border/60">
                                <h3 className="text-lg font-semibold text-foreground mb-4">Follow-up Actions</h3>
                                <div className="space-y-2">
                                    {analysis.recommendations.followUp.map((action, idx) => (<div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0"/>
                                                <p className="text-foreground">{action}</p>
                                            </div>
                                        </div>))}
                                </div>
                            </div>)}

                        {analysis.recommendations.lifestyle.length > 0 && (<div className="p-6 bg-card/70 rounded-2xl border border-border/60 md:col-span-2">
                                <h3 className="text-lg font-semibold text-foreground mb-4">Lifestyle Recommendations</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {analysis.recommendations.lifestyle.map((rec, idx) => (<div key={idx} className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0"/>
                                                <p className="text-foreground">{rec}</p>
                                            </div>
                                        </div>))}
                                </div>
                            </div>)}
                    </div>

                    {analysis.nextSteps.length > 0 && (<div className="p-6 bg-card/70 rounded-2xl border border-border/60">
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle className="w-5 h-5 text-blue-600"/>
                                <h3 className="text-lg font-semibold text-foreground">Next Steps</h3>
                            </div>
                            <div className="space-y-2">
                                {analysis.nextSteps.map((step, idx) => (<div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center gap-2">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                                                {idx + 1}
                                            </span>
                                            <p className="text-foreground">{step}</p>
                                        </div>
                                    </div>))}
                            </div>
                        </div>)}

                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5"/>
                            <div>
                                <p className="text-sm text-orange-800 dark:text-orange-300">
                                    <strong>Medical Disclaimer:</strong> This AI analysis is for informational purposes only and should not replace professional medical consultation. Always discuss your medical images and results with a qualified healthcare provider for proper interpretation and treatment recommendations.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>)}
        </PageContainer>);
}
