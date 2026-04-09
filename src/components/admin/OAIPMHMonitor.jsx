import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Copy, CheckCircle, Server, BarChart3, BookOpen } from 'lucide-react';

export default function OAIPMHMonitor() {
  const [registryLogs, setRegistryLogs] = useState([]);
  const [manuscripts, setManuscripts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const OAI_ENDPOINT = 'https://afrisci-nexus.com/api/functions/oaiPMH';

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [logs, allMs] = await Promise.all([
        base44.entities.OAIRegistry.list('-created_date', 100),
        base44.entities.Manuscript.filter({ status: 'published' }, '-created_date', 1000)
      ]);
      setRegistryLogs(logs);
      setManuscripts(allMs);
    } catch (error) {
      console.error('Error loading OAI data:', error);
    }
    setIsLoading(false);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(OAI_ENDPOINT);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const harvesters = [...new Set(registryLogs.map(log => log.harvester_name))];
  const totalRequests = registryLogs.length;
  const successfulRequests = registryLogs.filter(log => log.status_code === 200).length;
  const totalExposedRecords = manuscripts.length;
  const avgResponseTime = registryLogs.length > 0
    ? Math.round(registryLogs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / registryLogs.length)
    : 0;

  const registryServices = [
    {
      name: 'BASE (Bielefeld Academic Search Engine)',
      url: 'https://www.base-search.net/about/en/register_plugin.php',
      description: 'World\'s largest open access search engine (350M+ documents). Register your OAI endpoint to reach global researchers.',
      icon: '🔍'
    },
    {
      name: 'OpenAIRE',
      url: 'https://www.openaire.eu/harvest/oai-pmh',
      description: 'European open science infrastructure. Required for Horizon Europe compliance. Directly reaches EU-funded researchers.',
      icon: '🌐'
    },
    {
      name: 'CORE',
      url: 'https://core.ac.uk/about/harvesting/',
      description: 'Aggregates 230M+ open access research papers. Used by institutions and researchers globally.',
      icon: '📚'
    },
    {
      name: 'AJOL (African Journals OnLine)',
      url: 'https://www.ajol.info/',
      description: 'Primary discovery platform for African research. Direct regional visibility for AfriSci Nexus journals.',
      icon: '🌍'
    }
  ];

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Server className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">OAI-PMH Endpoint Monitor</h2>
          <p className="text-sm text-slate-500">Track harvester activity and manage indexer registrations.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Exposed Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalExposedRecords}</div>
            <p className="text-xs text-slate-500 mt-1">Published manuscripts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Harvester Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalRequests}</div>
            <p className="text-xs text-slate-500 mt-1">{successfulRequests} successful</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Harvesters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{harvesters.length}</div>
            <p className="text-xs text-slate-500 mt-1">Aggregators indexing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{avgResponseTime}ms</div>
            <p className="text-xs text-slate-500 mt-1">Response time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="endpoint" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="endpoint">Endpoint Details</TabsTrigger>
          <TabsTrigger value="registry">Register with Indexers</TabsTrigger>
          <TabsTrigger value="logs">Harvester Logs</TabsTrigger>
        </TabsList>

        {/* Endpoint Details Tab */}
        <TabsContent value="endpoint">
          <Card>
            <CardHeader>
              <CardTitle>OAI-PMH Endpoint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Your OAI-PMH endpoint is live and automatically serving {totalExposedRecords} published manuscripts in Dublin Core XML format.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">Base URL</p>
                <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-3 border border-slate-200">
                  <code className="flex-1 text-sm font-mono text-slate-700 break-all">{OAI_ENDPOINT}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyUrl}
                    className={`flex-shrink-0 ${copiedUrl ? 'text-green-600' : 'text-slate-600'}`}
                  >
                    {copiedUrl ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">OAI-PMH Verbs Supported</p>
                <div className="flex flex-wrap gap-2">
                  {['Identify', 'ListMetadataFormats', 'GetRecord', 'ListRecords', 'ListIdentifiers'].map(verb => (
                    <Badge key={verb} variant="outline">{verb}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">Test the Endpoint</p>
                <a href={`${OAI_ENDPOINT}?verb=Identify`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full justify-center">
                    📡 Test Identify Request
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registry Tab */}
        <TabsContent value="registry">
          <div className="space-y-4">
            <Alert className="bg-amber-50 border-amber-200">
              <BarChart3 className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Register your OAI-PMH endpoint with these major aggregators to enable automatic harvesting and global discoverability.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-4">
              {registryServices.map(service => (
                <Card key={service.name}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{service.icon} {service.name}</CardTitle>
                      </div>
                      {harvesters.some(h => h.toLowerCase().includes(service.name.toLowerCase())) && (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-600">{service.description}</p>
                    <a href={service.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="w-full">
                        Register Endpoint →
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-teal-200 bg-teal-50">
              <CardHeader>
                <CardTitle className="text-base">📋 Registration Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm text-slate-700">
                  <li><strong>1. Copy your OAI URL:</strong> {OAI_ENDPOINT}</li>
                  <li><strong>2. Visit each aggregator's registration page</strong> (links above)</li>
                  <li><strong>3. Paste the OAI endpoint URL</strong> in their registration form</li>
                  <li><strong>4. Verify ownership</strong> (usually automatic or via email confirmation)</li>
                  <li><strong>5. Enable harvesting</strong> and wait for their first sync (24-72 hours)</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Recent Harvester Requests ({registryLogs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {registryLogs.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No harvester requests yet. Register your endpoint with aggregators.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Harvester</TableHead>
                        <TableHead>Verb</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Time (ms)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registryLogs.slice(0, 20).map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm font-medium">{log.harvester_name || 'Unknown'}</TableCell>
                          <TableCell><Badge variant="outline">{log.verb}</Badge></TableCell>
                          <TableCell>{log.records_returned || '—'}</TableCell>
                          <TableCell className="text-xs">{log.response_time_ms || '—'}ms</TableCell>
                          <TableCell>
                            <Badge className={log.status_code === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {log.status_code || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {log.created_date ? new Date(log.created_date).toLocaleString() : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}