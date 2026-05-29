import '../lib/loadEnv.js';
import { analyzeResumeWithGemini } from '../services/geminiResumeAnalysis.js';
import { hasGeminiKey, getGeminiModelFallbacks } from '../lib/geminiConfig.js';
import { generateGeminiText } from '../lib/geminiClient.js';

const sample = `
Ibrahim Khan
AI / ML Engineer
Skills: Python, TensorFlow, PyTorch, Machine Learning, Deep Learning, NLP
Experience at tech company building ML pipelines.
`;

console.log('hasGeminiKey:', hasGeminiKey());
console.log('models:', getGeminiModelFallbacks());

try {
  const ping = await generateGeminiText('Reply with exactly: {"ok":true}', {
    maxOutputTokens: 32,
    requestTimeoutMs: 15000,
  });
  console.log('ping model:', ping.model);
  console.log('ping text:', ping.text.slice(0, 100));
} catch (err) {
  console.error('ping failed:', err.message);
}

const start = Date.now();
const result = await analyzeResumeWithGemini(sample, { name: 'Ibrahim', role: 'alumni' });
console.log('elapsed ms:', Date.now() - start);
console.log('result:', result ? JSON.stringify(result, null, 2) : 'NULL');
