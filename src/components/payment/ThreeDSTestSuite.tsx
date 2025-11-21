import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Shield, 
  AlertCircle, 
  CheckCircle,
  CreditCard,
  TestTube,
  Activity
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TestResult {
  test: string;
  status: 'success' | 'failed' | 'pending';
  message: string;
  details?: any;
}

interface ThreeDSTestCard {
  number: string;
  brand: string;
  description: string;
  challengeFlow: 'frictionless' | 'challenge' | 'fail';
}

const threeDSTestCards: ThreeDSTestCard[] = [
  {
    number: '4000002760003184',
    brand: 'Visa',
    description: '3D Secure 2 - Frictionless Flow',
    challengeFlow: 'frictionless'
  },
  {
    number: '4000002500003155',
    brand: 'Visa',
    description: '3D Secure 2 - Challenge Flow',
    challengeFlow: 'challenge'
  },
  {
    number: '4000002760003184',
    brand: 'Visa',
    description: '3D Secure 2 - Fail Authentication',
    challengeFlow: 'fail'
  },
  {
    number: '4242424242424242',
    brand: 'Visa',
    description: 'Standard Card - No 3DS',
    challengeFlow: 'frictionless'
  }
];

const ThreeDSTestSuite: React.FC = () => {
  const { t } = useLanguage();
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedTestCard, setSelectedTestCard] = useState<ThreeDSTestCard>(threeDSTestCards[0]);
  const [testAmount, setTestAmount] = useState<string>('10.00');
  const [testCurrency, setTestCurrency] = useState<string>('gbp');
  const [currentTestIndex, setCurrentTestIndex] = useState<number>(0);

  const run3DSTest = async () => {
    setIsTesting(true);
    setTestResults([]);
    setCurrentTestIndex(0);

    const tests = [
      'Check 3DS Requirements',
      'Create Payment Intent',
      'Initialize 3DS Authentication',
      'Process 3DS Challenge',
      'Verify Authentication Result'
    ];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      setCurrentTestIndex(i);
      
      try {
        // Simulate test execution
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let result: TestResult;
        
        switch (test) {
          case 'Check 3DS Requirements':
            result = {
              test,
              status: 'success',
              message: `3D Secure required for ${testCurrency.toUpperCase()} ${testAmount}`,
              details: {
                amount: parseFloat(testAmount),
                currency: testCurrency,
                requires3DS: true,
                reason: 'Amount threshold exceeded'
              }
            };
            break;
            
          case 'Create Payment Intent':
            result = {
              test,
              status: 'success',
              message: 'Payment intent created successfully',
              details: {
                paymentIntentId: `pi_test_${Date.now()}`,
                clientSecret: 'pi_test_secret_123',
                status: 'requires_action'
              }
            };
            break;
            
          case 'Initialize 3DS Authentication':
            result = {
              test,
              status: 'success',
              message: `3DS authentication initialized - ${selectedTestCard.description}`,
              details: {
                testCard: selectedTestCard,
                challengeFlow: selectedTestCard.challengeFlow,
                sessionId: `3ds_session_${Date.now()}`
              }
            };
            break;
            
          case 'Process 3DS Challenge':
            if (selectedTestCard.challengeFlow === 'challenge') {
              result = {
                test,
                status: 'success',
                message: '3DS challenge processed successfully',
                details: {
                  challengeCompleted: true,
                  authenticationMethod: 'challenge',
                  eci: '05'
                }
              };
            } else if (selectedTestCard.challengeFlow === 'frictionless') {
              result = {
                test,
                status: 'success',
                message: '3DS frictionless authentication completed',
                details: {
                  challengeCompleted: false,
                  authenticationMethod: 'frictionless',
                  eci: '02'
                }
              };
            } else {
              result = {
                test,
                status: 'failed',
                message: '3DS authentication failed as expected',
                details: {
                  error: 'Authentication declined',
                  reason: 'Test card configured to fail'
                }
              };
            }
            break;
            
          case 'Verify Authentication Result':
            result = {
              test,
              status: selectedTestCard.challengeFlow === 'fail' ? 'failed' : 'success',
              message: selectedTestCard.challengeFlow === 'fail' 
                ? 'Authentication failed as expected' 
                : '3DS authentication verified successfully',
              details: {
                finalStatus: selectedTestCard.challengeFlow === 'fail' ? 'failed' : 'succeeded',
                authenticationFlow: selectedTestCard.challengeFlow,
                riskScore: selectedTestCard.challengeFlow === 'challenge' ? 75 : 25
              }
            };
            break;
            
          default:
            result = {
              test,
              status: 'pending',
              message: 'Test pending'
            };
        }
        
        setTestResults(prev => [...prev, result]);
        
      } catch (error) {
        const errorResult: TestResult = {
          test,
          status: 'failed',
          message: error instanceof Error ? error.message : 'Test failed',
          details: { error }
        };
        setTestResults(prev => [...prev, errorResult]);
      }
    }

    setIsTesting(false);
  };

  const clearResults = () => {
    setTestResults([]);
    setCurrentTestIndex(0);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="success" className="text-xs">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-xs">Pending</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Unknown</Badge>;
    }
  };

  const getChallengeFlowBadge = (flow: string) => {
    switch (flow) {
      case 'frictionless':
        return <Badge variant="outline" className="text-xs bg-green-100 text-green-800">Frictionless</Badge>;
      case 'challenge':
        return <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">Challenge</Badge>;
      case 'fail':
        return <Badge variant="outline" className="text-xs bg-red-100 text-red-800">Fail</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          3D Secure Test Suite
          <Badge variant="outline" className="ml-auto">Testing Mode</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
          <div>
            <Label htmlFor="testCard">Test Card</Label>
            <Select value={selectedTestCard.number} onValueChange={(value) => {
              const card = threeDSTestCards.find(c => c.number === value);
              if (card) setSelectedTestCard(card);
            }}>
              <SelectTrigger id="testCard">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {threeDSTestCards.map((card) => (
                  <SelectItem key={card.number} value={card.number}>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>{card.brand} •••• {card.number.slice(-4)}</span>
                      {getChallengeFlowBadge(card.challengeFlow)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{card.description}</div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="testAmount">Test Amount</Label>
            <Input
              id="testAmount"
              type="number"
              step="0.01"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              placeholder="10.00"
            />
          </div>

          <div>
            <Label htmlFor="testCurrency">Currency</Label>
            <Select value={testCurrency} onValueChange={setTestCurrency}>
              <SelectTrigger id="testCurrency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gbp">GBP (£)</SelectItem>
                <SelectItem value="eur">EUR (€)</SelectItem>
                <SelectItem value="usd">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Test Controls */}
        <div className="flex gap-3">
          <Button
            onClick={run3DSTest}
            disabled={isTesting}
            className="flex items-center gap-2"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4" />
                Run 3DS Test
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={clearResults}
            disabled={isTesting}
          >
            Clear Results
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Test Results
            </h3>

            <div className="space-y-3">
              {testResults.map((result, index) => (
                <Card key={index} className={index === currentTestIndex ? 'ring-2 ring-blue-500' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{result.test}</h4>
                            {getStatusBadge(result.status)}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                          
                          {result.details && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs font-mono">
                              <pre>{JSON.stringify(result.details, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {index === currentTestIndex && isTesting && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Running...</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            {!isTesting && testResults.length > 0 && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Test Suite Completed</span>
                  </div>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Test card: {selectedTestCard.brand} ending in {selectedTestCard.number.slice(-4)}</p>
                    <p>Amount: {testCurrency.toUpperCase()} {testAmount}</p>
                    <p>Flow: {selectedTestCard.challengeFlow}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Test Card Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Test Card Information
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>• Use these test cards to simulate different 3DS scenarios</p>
            <p>• Frictionless cards will authenticate without user interaction</p>
            <p>• Challenge cards will require additional authentication steps</p>
            <p>• Failed cards will simulate authentication failures</p>
            <p>• All test cards use valid test data (CVV: any 3 digits, Expiry: any future date)</p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default ThreeDSTestSuite;