import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { runStockIntelligenceScan } from './src/services/langgraphAgent';
import { NSE_STOCKS, MARKET_INDICES, SECTOR_PERFORMANCE, CURRENT_MARKET_REGIME } from './src/services/marketData';
import { synthesizeStockOpportunityWithGemini, askStockAgentFollowUp } from './src/services/geminiService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API Endpoints
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    agent: 'ArthaGraph LangGraph Agent v2.4'
  });
});

app.get('/api/market-regime', (req: Request, res: Response) => {
  res.json({
    regime: CURRENT_MARKET_REGIME,
    indices: MARKET_INDICES,
    sectors: SECTOR_PERFORMANCE
  });
});

app.get('/api/stocks', (req: Request, res: Response) => {
  res.json({
    count: NSE_STOCKS.length,
    stocks: NSE_STOCKS
  });
});

app.post('/api/run-langgraph-scan', async (req: Request, res: Response) => {
  try {
    const mode = req.body.mode || 'BALANCED';
    const result = await runStockIntelligenceScan(mode);
    res.json(result);
  } catch (error: any) {
    console.error('Scan API error:', error);
    res.status(500).json({ error: error?.message || 'Failed to execute LangGraph scan' });
  }
});

app.post('/api/analyze-stock/:symbol', async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const stock = NSE_STOCKS.find(s => s.symbol.toUpperCase() === symbol);
    
    if (!stock) {
      return res.status(404).json({ error: `Stock ${symbol} not found in NSE universe` });
    }

    const opportunity = await synthesizeStockOpportunityWithGemini(
      stock, 
      req.body.setupType || 'Momentum Breakout', 
      CURRENT_MARKET_REGIME
    );

    res.json(opportunity);
  } catch (error: any) {
    console.error('Single stock analysis error:', error);
    res.status(500).json({ error: error?.message || 'Failed to analyze stock' });
  }
});

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, history, context } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const reply = await askStockAgentFollowUp(message, history || [], context || {});
    res.json({ reply, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: error?.message || 'Failed to process chat message' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ArthaGraph] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
