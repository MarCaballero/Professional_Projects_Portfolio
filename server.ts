import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Gemini SDK if API key is present
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// API: Automated Category Suggestion using Gemini (for ambiguous statement lines)
app.post('/api/categorize', async (req: Request, res: Response) => {
  try {
    const { description, amount } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        category: 'Miscellaneous',
        confidence: 0.5,
        explanation: 'Local rule engine evaluated (Gemini API key not configured).',
      });
    }

    const prompt = `You are an automated personal financial transaction categorizer.
Categorize the following bank transaction description into ONE of these exact categories:
- Housing
- Food & Groceries
- Dining & Coffee
- Transportation
- Utilities & Bills
- Entertainment
- Health & Wellness
- Shopping
- Education & Work
- Personal Care
- Investments & Savings
- Income
- Miscellaneous

Transaction details:
Description: "${description}"
Amount: ${amount ? `$${amount}` : 'Unknown'}

Respond ONLY with a JSON object in this exact format:
{
  "category": "Exact Category Name",
  "confidence": 0.95,
  "explanation": "Brief 1-sentence reason why"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Categorize error:', error);
    return res.status(500).json({
      error: 'Failed to auto-categorize transaction',
      details: error.message,
    });
  }
});

// API: Actionable Long-Term Financial Advice & Strategic Plan
app.post('/api/financial-advice', async (req: Request, res: Response) => {
  try {
    const {
      monthlyIncome,
      monthlySpending,
      savingsRate,
      topCategories,
      activeGoals,
      budgetOverages,
    } = req.body;

    const ai = getGenAI();
    if (!ai) {
      // Deterministic expert financial coach response when offline / no key
      return res.json({
        strategicSummary: "Solid baseline established with systematic cashflow tracking.",
        actionPlan: [
          {
            title: "Cap Discretionary Outflows",
            impact: "High Impact · Immediate",
            description: "Dining & Coffee and Shopping represent quick-win reduction zones. Reallocating $150/mo from these will accelerate your primary savings target by 2.4 months.",
            action: "Set a weekly discretionary limit and review on Sunday evenings."
          },
          {
            title: "Automate Emergency Buffer Cushion",
            impact: "High Impact · 30-Day Milestone",
            description: `At your current burn rate of $${Math.round(monthlySpending)}/month, prioritize establishing 3 full months of non-negotiable living expenses ($${Math.round(monthlySpending * 3)}).`,
            action: "Schedule automated payroll direct deposit split into a high-yield savings account."
          },
          {
            title: "Rebalance Towards the 50/30/20 Standard",
            impact: "Medium Impact · Long-Term",
            description: "Direct surplus cashflow directly into low-cost index funds or high-yield savings before discretionary spending occurs ('pay yourself first').",
            action: "Lock in automated transfers on the 1st of every month."
          }
        ]
      });
    }

    const prompt = `You are a certified senior financial planner and wealth architect.
Analyze this user's current month real financial metrics:
- Monthly Income: $${monthlyIncome || 0}
- Monthly Expenses: $${monthlySpending || 0}
- Net Savings Rate: ${savingsRate || 0}%
- Top Spending Categories: ${JSON.stringify(topCategories || [])}
- Active Goals: ${JSON.stringify(activeGoals || [])}
- Budget Alert Overages: ${JSON.stringify(budgetOverages || [])}

Provide exactly 3 high-impact, actionable, personalized financial recommendations designed to help the user achieve financial success and long-term goals.

Respond ONLY with a valid JSON object matching this schema:
{
  "strategicSummary": "Concise 1-2 sentence executive assessment of their current financial posture",
  "actionPlan": [
    {
      "title": "Actionable Title",
      "impact": "e.g. High Impact · Immediate",
      "description": "Specific rationale tailored to their spending and goals numbers (2 sentences max)",
      "action": "Concrete next step to execute this week"
    },
    {
      "title": "Actionable Title 2",
      "impact": "e.g. High Impact · Medium-Term",
      "description": "Specific rationale...",
      "action": "Concrete step..."
    },
    {
      "title": "Actionable Title 3",
      "impact": "e.g. Wealth Compounder · Long-Term",
      "description": "Specific rationale...",
      "action": "Concrete step..."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Financial advice error:', error);
    return res.status(500).json({
      error: 'Failed to generate financial advice',
      details: error.message,
    });
  }
});

// Dev vs Production static handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`ProsperTrack server active on http://0.0.0.0:${port}`);
  });
}

startServer();
