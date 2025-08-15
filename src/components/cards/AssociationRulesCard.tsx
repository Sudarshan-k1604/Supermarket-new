
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, ShoppingCart, ArrowRight } from 'lucide-react';

interface AssociationRule {
  antecedents: string[];
  consequents: string[];
  support: number;
  confidence: number;
  lift: number;
}

interface AssociationRulesCardProps {
  data: AssociationRule[];
}

// Mock data for demonstration when no real data is available
const mockAssociationRules: AssociationRule[] = [
  {
    antecedents: ['Coffee Beans'],
    consequents: ['Sugar'],
    support: 0.25,
    confidence: 0.85,
    lift: 2.1
  },
  {
    antecedents: ['Bread'],
    consequents: ['Butter'],
    support: 0.30,
    confidence: 0.75,
    lift: 1.8
  },
  {
    antecedents: ['Pasta'],
    consequents: ['Tomato Sauce'],
    support: 0.20,
    confidence: 0.90,
    lift: 2.5
  },
  {
    antecedents: ['Chips'],
    consequents: ['Soda'],
    support: 0.15,
    confidence: 0.70,
    lift: 1.9
  },
  {
    antecedents: ['Milk'],
    consequents: ['Cereal'],
    support: 0.22,
    confidence: 0.80,
    lift: 2.2
  }
];

export const AssociationRulesCard: React.FC<AssociationRulesCardProps> = ({ data }) => {
  // Use mock data if no real data is provided
  const displayData = data && data.length > 0 ? data : mockAssociationRules;
  const isUsingMockData = !data || data.length === 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Smart Recommendations
          {isUsingMockData && (
            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
              Demo Data
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-sm text-slate-600">
          Items frequently bought together. Use these insights for product placement and promotions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayData.slice(0, 4).map((rule, index) => {
            const antecedent = Array.isArray(rule.antecedents) 
              ? rule.antecedents[0] 
              : rule.antecedents;
            const consequent = Array.isArray(rule.consequents) 
              ? rule.consequents[0] 
              : rule.consequents;
            
            const confidencePercentage = (rule.confidence * 100).toFixed(0);
            const supportPercentage = (rule.support * 100).toFixed(1);
            
            return (
              <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      {confidencePercentage}% confidence
                    </Badge>
                    <Badge variant="outline" className="text-xs text-slate-600">
                      {supportPercentage}% support
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Lift: {rule.lift?.toFixed(1) || 'N/A'}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border">
                    <ShoppingCart className="h-3 w-3 text-slate-500" />
                    <span className="font-medium text-slate-900 text-sm">{antecedent}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-md border border-blue-200">
                    <ShoppingCart className="h-3 w-3 text-blue-600" />
                    <span className="font-medium text-blue-700 text-sm">{consequent}</span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-600">
                  <strong>{confidencePercentage}%</strong> of customers who buy <strong>{antecedent}</strong> also purchase <strong>{consequent}</strong>
                </p>
                
                {rule.lift > 2.0 && (
                  <div className="mt-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                    🔥 <strong>Strong Association</strong> - High cross-selling opportunity
                  </div>
                )}
              </div>
            );
          })}
          
          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
            💡 <strong>Merchandising Tips:</strong>
            <ul className="mt-1 space-y-1 ml-4">
              <li>• Place these items near each other in your store</li>
              <li>• Create bundle offers for higher-confidence pairs</li>
              <li>• Use these insights for targeted promotions</li>
              <li>• Higher confidence = stronger buying patterns</li>
            </ul>
          </div>
          
          {isUsingMockData && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
              📊 <strong>Note:</strong> This is demo data. Connect your sales data to see real product associations.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
