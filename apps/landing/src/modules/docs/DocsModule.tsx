import React, { useState } from 'react';
import { BookOpen, Code, Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { Badge, Button } from '@dineflow/ui';

export const DocsModule: React.FC = () => {
  const [activeEndpoint, setActiveEndpoint] = useState<'menu' | 'dish' | 'quota'>('menu');
  const [copied, setCopied] = useState(false);

  const endpoints = [
    {
      id: 'menu',
      method: 'GET',
      path: '/api/v1/hotels/{hotel_id}/menu',
      summary: 'Fetch Public Hotel Menu',
      description: 'Retrieves active categories and available food items for a hotel tenant.',
      curl: `curl -X GET "https://dineflow.app/api/v1/hotels/gusto/menu" \\
  -H "Authorization: Bearer df_live_YOUR_KEY" \\
  -H "Content-Type: application/json"`,
      response: `{
  "hotel": {
    "name": "Gusto Italian Bistro",
    "currency": "USD",
    "currency_symbol": "$"
  },
  "categories": [
    { "id": "cat_1", "name": "Handmade Pasta", "sort_order": 1 }
  ],
  "items": [
    {
      "id": "dish_1",
      "name": "Truffle Infused Tagliolini",
      "price": 26.50,
      "calories": 620,
      "dietary_tags": ["vegetarian"],
      "is_available": true
    }
  ]
}`,
    },
    {
      id: 'dish',
      method: 'POST',
      path: '/api/v1/hotels/{hotel_id}/dishes',
      summary: 'Create Dish (Quota Checked)',
      description: 'Programmatically adds a dish. Returns 403 Forbidden if plan capacity is reached.',
      curl: `curl -X POST "https://dineflow.app/api/v1/hotels/gusto/dishes" \\
  -H "Authorization: Bearer df_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Wood-Fired Pizza Margherita",
    "price": 18.00,
    "category_id": "cat_1",
    "dietary_tags": ["vegetarian"]
  }'`,
      response: `{
  "success": true,
  "data": {
    "id": "item_8849",
    "name": "Wood-Fired Pizza Margherita",
    "price": 18.00,
    "created_at": "2026-10-17T15:00:00Z"
  }
}`,
    },
    {
      id: 'quota',
      method: 'GET',
      path: '/api/v1/hotels/{hotel_id}/entitlements',
      summary: 'Get Quota & Plan Limits',
      description: 'Returns real-time consumption of staff seats, dishes, and media megabytes.',
      curl: `curl -X GET "https://dineflow.app/api/v1/hotels/gusto/entitlements" \\
  -H "Authorization: Bearer df_live_YOUR_KEY"`,
      response: `{
  "plan": "Pro Culinary",
  "limits": {
    "max_food_items": 120,
    "current_food_items": 42,
    "remaining_food_items": 78,
    "max_staff_accounts": 10,
    "storage_mb": 500,
    "storage_used_mb": 48.2
  }
}`,
    },
  ];

  const current = endpoints.find((e) => e.id === activeEndpoint) || endpoints[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="docs" className="py-20 bg-slate-900/60 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 mb-12">
          <Badge variant="sky" size="md">
            OpenAPI v3.1 Specification
          </Badge>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Developer-First REST API Layer
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm">
            Connect third-party POS terminals, digital kitchen displays, and mobile order kiosks
            with rate-limited, scoped hotel API keys.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">
          {/* Endpoints Sidebar */}
          <div className="lg:w-80 bg-slate-900/90 border-r border-slate-800 p-4 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
              Endpoints
            </p>
            {endpoints.map((ep) => (
              <button
                key={ep.id}
                onClick={() => setActiveEndpoint(ep.id as any)}
                className={`w-full text-left p-3 rounded-2xl transition cursor-pointer ${
                  activeEndpoint === ep.id
                    ? 'bg-slate-800 border border-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                      ep.method === 'GET'
                        ? 'bg-sky-950 text-sky-400 border border-sky-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-xs font-semibold text-white truncate">{ep.summary}</span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 truncate">{ep.path}</p>
              </button>
            ))}
          </div>

          {/* Code & Response Preview */}
          <div className="flex-1 p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-orange-400">
                    {current.method}
                  </span>
                  <span className="font-mono text-xs text-white">{current.path}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{current.description}</p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={copied ? Check : Copy}
                onClick={handleCopy}
              >
                {copied ? 'Copied' : 'Copy cURL'}
              </Button>
            </div>

            {/* Request cURL */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Example Request:
              </p>
              <pre className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-orange-300 font-mono text-xs overflow-x-auto">
                {current.curl}
              </pre>
            </div>

            {/* Response JSON */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Standard 200 OK JSON Response:
              </p>
              <pre className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-300 font-mono text-xs overflow-x-auto">
                {current.response}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
